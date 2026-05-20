'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from '@/lib/toast';
import type {
  ConversationKey,
  ConversationMessage,
} from '../../data/team-chat-ui-data';
import { mapAttachmentToConversationMessageAttachment } from '../../lib/team-chat-api-mappers';
import {
  buildForwardedRenderOverrideFromMessage,
  type ForwardedMessageRenderOverride,
} from '../../lib/screen-controller/team-chat-controller-message.utils';
import type { TeamChatForwardMessageResponse } from '../../services/types/team-chat.types';

interface ForwardState {
  message: ConversationMessage;
  sourceConversationLabel: string;
  sourceConversationSubtitle: string;
}

interface ForwardTargetLookupItem {
  id: string;
  kind: 'channel' | 'dm' | 'group_dm';
  title: string;
}

interface ForwardMessageResultLike {
  ok: boolean;
  data?: TeamChatForwardMessageResponse;
  error?: {
    message: string;
  };
}

export function useTeamChatMessageForwardActions(params: {
  activeRoomId: string;
  forwardState: ForwardState | null;
  forwardTargetLookup: Map<ConversationKey, ForwardTargetLookupItem>;
  canForwardActiveConversationMessage: boolean;
  notifyCannotForwardMessage: () => void;
  forwardMessage: (params: {
    roomId: string;
    messageId: string;
    body: {
      targetRoomIds: string[];
      note?: string;
      clientMessageIdPrefix: string;
    };
  }) => Promise<ForwardMessageResultLike>;
  openForwardTargetRoom: (roomId: string) => void;
  setForwardState: Dispatch<SetStateAction<ForwardState | null>>;
  setForwardedAuthorOverridesByMessageId: Dispatch<
    SetStateAction<Record<string, string>>
  >;
  setForwardedRenderOverridesByMessageId: Dispatch<
    SetStateAction<Record<string, ForwardedMessageRenderOverride>>
  >;
  onForwardCommitted?: (payload: {
    result: TeamChatForwardMessageResponse;
    note: string;
  }) => void;
}) {
  const {
    activeRoomId,
    forwardState,
    forwardTargetLookup,
    canForwardActiveConversationMessage,
    notifyCannotForwardMessage,
    forwardMessage,
    openForwardTargetRoom,
    setForwardState,
    setForwardedAuthorOverridesByMessageId,
    setForwardedRenderOverridesByMessageId,
    onForwardCommitted,
  } = params;

  const resolveFailedTargetLabel = useCallback(
    (targetRoomId: string) => {
      const normalizedRoomId = targetRoomId.trim();
      if (!normalizedRoomId) return 'Unknown destination';

      const matchedTarget =
        Array.from(forwardTargetLookup.values()).find(
          (target) => target.id.trim() === normalizedRoomId,
        ) ?? null;
      if (!matchedTarget) return normalizedRoomId;

      if (matchedTarget.kind === 'channel') return `#${matchedTarget.title}`;
      if (matchedTarget.kind === 'group_dm') return `Group ${matchedTarget.title}`;
      return `DM ${matchedTarget.title}`;
    },
    [forwardTargetLookup],
  );

  const normalizeFailedReason = useCallback((reason?: string) => {
    const normalizedReason = reason?.trim() ?? '';
    if (!normalizedReason) return 'unknown error';

    const normalizedReasonLower = normalizedReason.toLowerCase();
    if (
      normalizedReasonLower.includes('permission') ||
      normalizedReasonLower.includes('forbidden') ||
      normalizedReasonLower.includes('not allowed')
    ) {
      return 'no permission';
    }

    if (normalizedReasonLower.includes('archiv')) {
      return 'room archived';
    }

    if (normalizedReasonLower.includes('hidden')) {
      return 'room hidden';
    }

    if (
      normalizedReasonLower.includes('scope') ||
      normalizedReasonLower.includes('project')
    ) {
      return 'out of current scope';
    }

    return normalizedReason;
  }, []);

  const handleForwardSubmit = useCallback(
    async (payload: { note: string; targetKeys: ConversationKey[] }) => {
      if (!forwardState || !activeRoomId || payload.targetKeys.length === 0) return;
      if (!canForwardActiveConversationMessage) {
        notifyCannotForwardMessage();
        return;
      }

      const targetRoomIds = Array.from(
        new Set(
          payload.targetKeys
            .map((targetKey) => forwardTargetLookup.get(targetKey)?.id?.trim() ?? '')
            .filter(Boolean),
        ),
      );
      if (targetRoomIds.length === 0) {
        toast.warning('Please select at least one destination');
        return;
      }

      const forwardNote = payload.note.trim();
      const forwardResult = await forwardMessage({
        roomId: activeRoomId,
        messageId: forwardState.message.id,
        body: {
          targetRoomIds,
          note: forwardNote || undefined,
          clientMessageIdPrefix: `forward-${Date.now()}`,
        },
      });

      if (!forwardResult.ok) {
        toast.danger(forwardResult.error?.message ?? 'Unable to forward message');
        return;
      }

      if (!forwardResult.data) {
        toast.danger('Unable to forward message');
        return;
      }

      const resultData = forwardResult.data;
      if (resultData.forwardedCount <= 0) {
        toast.danger('Forward failed for all selected conversations');
        return;
      }

      if (resultData.failedCount > 0) {
        const failedTargets = resultData.results
          .filter((item) => !item.forwarded)
          .map((item) => {
            const targetLabel = resolveFailedTargetLabel(item.targetRoomId);
            const reason = normalizeFailedReason(item.error);
            return `${targetLabel} (${reason})`;
          });

        if (failedTargets.length > 0) {
          const failedPreviewLimit = 3;
          const preview = failedTargets.slice(0, failedPreviewLimit).join(', ');
          const remaining = failedTargets.length - failedPreviewLimit;
          toast.warning(
            remaining > 0 ? `Failed: ${preview}, +${remaining} more` : `Failed: ${preview}`,
          );
        } else {
          toast.warning(`${resultData.failedCount} destination(s) could not be forwarded`);
        }
      }

      setForwardedAuthorOverridesByMessageId((previous) => {
        const next = { ...previous };
        let changed = false;

        const sourceAuthor = forwardState.message.author.trim();
        if (
          sourceAuthor.length > 0 &&
          sourceAuthor !== 'Unknown user' &&
          previous[forwardState.message.id] !== sourceAuthor
        ) {
          next[forwardState.message.id] = sourceAuthor;
          changed = true;
        }

        return changed ? next : previous;
      });

      setForwardedRenderOverridesByMessageId((previous) => {
        const next = { ...previous };
        let changed = false;

        resultData.results.forEach((item) => {
          const targetMessageId = item.forwarded ? item.message?.id?.trim() : '';
          if (!targetMessageId) return;

          const sourceAttachmentRecords =
            item.message?.attachments?.length
              ? item.message.attachments
              : item.attachments;
          const mappedForwardedAttachments = forwardState.message.forwardedMessage
            ? undefined
            : sourceAttachmentRecords?.map(mapAttachmentToConversationMessageAttachment);
          next[targetMessageId] = buildForwardedRenderOverrideFromMessage(
            forwardState.message,
            forwardNote,
            mappedForwardedAttachments,
          );
          changed = true;
        });

        return changed ? next : previous;
      });

      onForwardCommitted?.({
        result: resultData,
        note: forwardNote,
      });

      setForwardState(null);

      const firstSuccessTarget = resultData.results.find((item) => item.forwarded);
      if (firstSuccessTarget?.targetRoomId) {
        openForwardTargetRoom(firstSuccessTarget.targetRoomId);
      }

      toast.success(
        resultData.forwardedCount === 1
          ? 'Message forwarded'
          : `Message forwarded to ${resultData.forwardedCount} conversations`,
      );
    },
    [
      activeRoomId,
      canForwardActiveConversationMessage,
      forwardMessage,
      forwardState,
      forwardTargetLookup,
      normalizeFailedReason,
      notifyCannotForwardMessage,
      openForwardTargetRoom,
      resolveFailedTargetLabel,
      setForwardState,
      setForwardedAuthorOverridesByMessageId,
      setForwardedRenderOverridesByMessageId,
      onForwardCommitted,
    ],
  );

  return {
    handleForwardSubmit,
  };
}
