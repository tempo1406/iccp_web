'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';
import {
  resolveTeamChatProjectRoomAccessMessage,
  resolveTeamChatScopeGuardErrorMessage,
} from '../../lib/screen-controller/team-chat-controller-room.utils';
import type {
  TeamChatAcceptInvitationResponse,
  TeamChatMemberRole,
  TeamChatRoomType,
} from '../../services/types/team-chat.types';

interface BasicResultLike {
  ok: boolean;
  error?: {
    message: string;
  };
}

interface UpdateReadStateResultLike extends BasicResultLike {
  data?: {
    isManualUnreadByUser?: boolean | null;
    manualUnreadAt?: string | null;
    manualUnreadFromMessageId?: string | null;
  };
}

interface RemoveMemberResultLike extends BasicResultLike {
  data?: {
    transferredOwnerUserId?: string | null;
  };
}

interface UpdateMemberRoleResultLike extends BasicResultLike {
  data?: {
    updated: boolean;
  };
}

interface InviteMembersResultLike extends BasicResultLike {
  data?: Array<{
    memberRole: TeamChatMemberRole;
  }>;
}

interface JoinRoomResultLike extends BasicResultLike {
  data?: {
    joined: boolean;
    room: {
      id: string;
      roomType: TeamChatRoomType;
    };
  };
}

interface AcceptInvitationResultLike extends BasicResultLike {
  data?: TeamChatAcceptInvitationResponse;
}

interface MarkAllResultLike extends BasicResultLike {
  data?: {
    updatedCount?: number;
  };
}

interface PersonalFeedReadItem {
  id: string;
  kind: string;
  isUnread: boolean;
  isReadStateDerived?: boolean;
}

type UpdateReadStatePayload =
  | {
      mode: 'mark_unread';
      fromMessageId: string;
    }
  | {
      mode: 'mark_read';
      lastReadMessageId?: string;
    };

export function useTeamChatRoomMembershipActions(params: {
  activeRoomId: string;
  activeRoomMessages: { id: string }[];
  organizationId?: string | null;
  unreadRoomIds: string[];
  activeParticipantNameByUserId: Map<string, string>;
  personalFeedItems: PersonalFeedReadItem[];
  manualUnreadRoomIdsRef: MutableRefObject<Set<string>>;
  setManualUnreadRoomIds: Dispatch<SetStateAction<string[]>>;
  syncManualUnreadRoomState: (params: {
    roomId: string;
    isManualUnreadByUser?: boolean | null;
    manualUnreadAt?: string | null;
    manualUnreadFromMessageId?: string | null;
  }) => void;
  readStateSyncRef: MutableRefObject<Record<string, string>>;
  markPersonalFeedsReadOptimistically: (feedIds: string[]) => void;
  revertPersonalFeedsReadOptimistically: (feedIds: string[]) => void;
  openResolvedRoom: (roomId: string, roomType: TeamChatRoomType) => void;
  resolveRoomType: (roomId: string) => Promise<TeamChatRoomType | undefined>;
  setJoiningPublicRoomId: Dispatch<SetStateAction<string | null>>;
  updateReadState: (params: {
    roomId: string;
    body: UpdateReadStatePayload;
  }) => Promise<UpdateReadStateResultLike>;
  removeMember: (params: {
    roomId: string;
    memberId: string;
  }) => Promise<RemoveMemberResultLike>;
  updateMemberRole: (params: {
    roomId: string;
    memberId: string;
    body: {
      memberRole: TeamChatMemberRole;
    };
  }) => Promise<UpdateMemberRoleResultLike>;
  inviteMembers: (params: {
    roomId: string;
    body: {
      userIds: string[];
      memberRole: TeamChatMemberRole;
      inviteMessage?: string;
    };
  }) => Promise<InviteMembersResultLike>;
  joinRoom: (roomId: string) => Promise<JoinRoomResultLike>;
  acceptInvitation: (invitationId: string) => Promise<AcceptInvitationResultLike>;
  markAllMentionsRead: (params: Record<string, never>) => Promise<MarkAllResultLike>;
  markAllNotificationsRead: (params: {
    organizationId?: string;
  }) => Promise<MarkAllResultLike>;
}) {
  const {
    activeRoomId,
    activeRoomMessages,
    organizationId,
    unreadRoomIds,
    activeParticipantNameByUserId,
    personalFeedItems,
    manualUnreadRoomIdsRef,
    setManualUnreadRoomIds,
    syncManualUnreadRoomState,
    readStateSyncRef,
    markPersonalFeedsReadOptimistically,
    revertPersonalFeedsReadOptimistically,
    openResolvedRoom,
    resolveRoomType,
    setJoiningPublicRoomId,
    updateReadState,
    removeMember,
    updateMemberRole,
    inviteMembers,
    joinRoom,
    acceptInvitation,
    markAllMentionsRead,
    markAllNotificationsRead,
  } = params;
  const t = useTranslations('teamChat.membershipActions');

  const handleMarkConversationUnread = useCallback(async () => {
    if (!activeRoomId) return false;

    const fromMessageId = activeRoomMessages[activeRoomMessages.length - 1]?.id;
    if (!fromMessageId) {
      toast.warning('No message available to mark unread from');
      return false;
    }

    const hadManualUnreadBefore = manualUnreadRoomIdsRef.current.has(activeRoomId);
    if (!hadManualUnreadBefore) {
      manualUnreadRoomIdsRef.current.add(activeRoomId);
      setManualUnreadRoomIds((previous) =>
        previous.includes(activeRoomId) ? previous : [...previous, activeRoomId],
      );
    }
    syncManualUnreadRoomState({
      roomId: activeRoomId,
      isManualUnreadByUser: true,
      manualUnreadAt: new Date().toISOString(),
      manualUnreadFromMessageId: fromMessageId,
    });

    const result = await updateReadState({
      roomId: activeRoomId,
      body: {
        mode: 'mark_unread',
        fromMessageId,
      },
    });

    if (!result.ok) {
      if (!hadManualUnreadBefore) {
        manualUnreadRoomIdsRef.current.delete(activeRoomId);
        setManualUnreadRoomIds((previous) =>
          previous.filter((roomId) => roomId !== activeRoomId),
        );
        syncManualUnreadRoomState({
          roomId: activeRoomId,
          isManualUnreadByUser: false,
          manualUnreadAt: null,
          manualUnreadFromMessageId: null,
        });
      }
      toast.danger(result.error?.message ?? 'Unable to mark conversation unread');
      return false;
    }

    if (typeof result.data?.isManualUnreadByUser === 'boolean') {
      syncManualUnreadRoomState({
        roomId: activeRoomId,
        isManualUnreadByUser: result.data.isManualUnreadByUser,
        manualUnreadAt: result.data.manualUnreadAt,
        manualUnreadFromMessageId: result.data.manualUnreadFromMessageId,
      });
    }

    delete readStateSyncRef.current[activeRoomId];
    return true;
  }, [
    activeRoomId,
    activeRoomMessages,
    manualUnreadRoomIdsRef,
    setManualUnreadRoomIds,
    syncManualUnreadRoomState,
    readStateSyncRef,
    updateReadState,
  ]);

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (!activeRoomId) return false;

      const removeMemberResult = await removeMember({
        roomId: activeRoomId,
        memberId,
      });

      if (!removeMemberResult.ok) {
        toast.danger(
          resolveTeamChatScopeGuardErrorMessage(
            removeMemberResult.error?.message ?? 'Unable to remove member',
            'This member action is outside your project scope.',
          ),
        );
        return false;
      }

      if (removeMemberResult.data?.transferredOwnerUserId) {
        const nextOwnerName =
          activeParticipantNameByUserId.get(
            removeMemberResult.data.transferredOwnerUserId,
          ) ?? 'another member';
        toast.success(`Ownership transferred to ${nextOwnerName}`);
      }

      return true;
    },
    [activeParticipantNameByUserId, activeRoomId, removeMember],
  );

  const handleUpdateMemberRole = useCallback(
    async (memberId: string, memberRole: 'owner' | 'admin' | 'member' | 'guest') => {
      if (!activeRoomId) return false;

      const updateMemberRoleResult = await updateMemberRole({
        roomId: activeRoomId,
        memberId,
        body: { memberRole },
      });

      if (!updateMemberRoleResult.ok) {
        toast.danger(
          resolveTeamChatScopeGuardErrorMessage(
            updateMemberRoleResult.error?.message ?? 'Unable to update member role',
            'You cannot change member roles outside your project scope.',
          ),
        );
        return false;
      }

      if (!updateMemberRoleResult.data?.updated) {
        toast.warning('Server kept the existing member role.');
        return false;
      }

      return true;
    },
    [activeRoomId, updateMemberRole],
  );

  const handleInviteMembers = useCallback(
    async (inviteParams: {
      userIds: string[];
      memberRole: 'admin' | 'member' | 'guest';
      inviteMessage?: string;
    }) => {
      if (!activeRoomId) return false;
      if (inviteParams.userIds.length === 0) {
        toast.warning('Please provide at least one user ID');
        return false;
      }

      const inviteMembersResult = await inviteMembers({
        roomId: activeRoomId,
        body: {
          userIds: inviteParams.userIds,
          memberRole: inviteParams.memberRole,
          inviteMessage: inviteParams.inviteMessage?.trim() || undefined,
        },
      });

      if (!inviteMembersResult.ok) {
        toast.danger(
          resolveTeamChatScopeGuardErrorMessage(
            inviteMembersResult.error?.message ?? 'Unable to invite members',
            'You can only invite members who belong to this project scope.',
          ),
        );
        return false;
      }

      const invitedItems = inviteMembersResult.data ?? [];
      const invitedRoles = Array.from(
        new Set(invitedItems.map((invitation) => invitation.memberRole)),
      );
      const roleLabel = invitedRoles.length === 1 ? ` as ${invitedRoles[0]}` : '';
      toast.success(`Invited ${invitedItems.length} member(s)${roleLabel}`);
      return true;
    },
    [activeRoomId, inviteMembers],
  );

  const handleJoinPublicRoom = useCallback(
    async (roomId = activeRoomId) => {
      const targetRoomId = roomId?.trim() ?? '';
      if (!targetRoomId) return false;

      setJoiningPublicRoomId(targetRoomId);
      const joinRoomResult = await joinRoom(targetRoomId);
      setJoiningPublicRoomId(null);

      if (!joinRoomResult.ok || !joinRoomResult.data) {
        toast.danger(
          resolveTeamChatProjectRoomAccessMessage(
            joinRoomResult.error?.message ?? 'Unable to join room',
          ),
        );
        return false;
      }

      openResolvedRoom(joinRoomResult.data.room.id, joinRoomResult.data.room.roomType);

      if (joinRoomResult.data.joined) {
        toast.success(
          joinRoomResult.data.room.roomType === 'group_dm'
            ? t('joinedGroupChat')
            : t('joinedChannel'),
        );
      } else {
        toast.infor(t('alreadyMember'));
      }
      return true;
    },
    [activeRoomId, joinRoom, openResolvedRoom, setJoiningPublicRoomId, t],
  );

  const handleMarkAllMentionsRead = useCallback(async () => {
    const unreadMentionIds = personalFeedItems
      .filter((item) => item.kind === 'mentions' && item.isUnread)
      .map((item) => item.id);

    markPersonalFeedsReadOptimistically(unreadMentionIds);

    const markAllMentionsResult = await markAllMentionsRead({});
    if (!markAllMentionsResult.ok) {
      revertPersonalFeedsReadOptimistically(unreadMentionIds);
      toast.danger(
        markAllMentionsResult.error?.message ?? 'Unable to mark mentions read',
      );
      return false;
    }

    return true;
  }, [
    markAllMentionsRead,
    markPersonalFeedsReadOptimistically,
    personalFeedItems,
    revertPersonalFeedsReadOptimistically,
  ]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    const unreadNotificationIds = personalFeedItems
      .filter(
        (item) => item.kind !== 'mentions' && item.isUnread && !item.isReadStateDerived,
      )
      .map((item) => item.id);

    markPersonalFeedsReadOptimistically(unreadNotificationIds);

    const markAllNotificationsResult = await markAllNotificationsRead(
      organizationId ? { organizationId } : {},
    );
    if (!markAllNotificationsResult.ok) {
      revertPersonalFeedsReadOptimistically(unreadNotificationIds);
      toast.danger(
        markAllNotificationsResult.error?.message ?? 'Unable to mark notifications read',
      );
      return false;
    }

    return true;
  }, [
    markAllNotificationsRead,
    markPersonalFeedsReadOptimistically,
    organizationId,
    personalFeedItems,
    revertPersonalFeedsReadOptimistically,
  ]);

  const handleMarkAllRoomReadStates = useCallback(async () => {
    if (unreadRoomIds.length === 0) return true;

    let hasFailures = false;

    for (const roomId of unreadRoomIds) {
      if (!roomId) continue;

      manualUnreadRoomIdsRef.current.delete(roomId);
      delete readStateSyncRef.current[roomId];
      syncManualUnreadRoomState({
        roomId,
        isManualUnreadByUser: false,
        manualUnreadAt: null,
        manualUnreadFromMessageId: null,
      });

      const result = await updateReadState({
        roomId,
        body: { mode: 'mark_read' },
      });

      if (!result.ok) {
        hasFailures = true;
      }
    }

    setManualUnreadRoomIds((previous) =>
      previous.filter((roomId) => !unreadRoomIds.includes(roomId)),
    );

    return !hasFailures;
  }, [
    manualUnreadRoomIdsRef,
    readStateSyncRef,
    setManualUnreadRoomIds,
    syncManualUnreadRoomState,
    unreadRoomIds,
    updateReadState,
  ]);

  const handleMarkAllUnreadActivities = useCallback(async () => {
    const [mentionsDone, notificationsDone, roomReadDone] = await Promise.all([
      handleMarkAllMentionsRead(),
      handleMarkAllNotificationsRead(),
      handleMarkAllRoomReadStates(),
    ]);
    if (!roomReadDone) {
      toast.warning('Some conversations could not be marked as read.');
    }
    return mentionsDone && notificationsDone && roomReadDone;
  }, [
    handleMarkAllMentionsRead,
    handleMarkAllNotificationsRead,
    handleMarkAllRoomReadStates,
  ]);

  const handleAcceptInvitation = useCallback(
    async (invitationId: string) => {
      const normalizedInvitationId = invitationId.trim();
      if (!normalizedInvitationId) return false;

      const acceptInvitationResult = await acceptInvitation(normalizedInvitationId);
      if (!acceptInvitationResult.ok || !acceptInvitationResult.data) {
        toast.danger(
          resolveTeamChatScopeGuardErrorMessage(
            acceptInvitationResult.error?.message ?? t('acceptInvitationFailed'),
            t('acceptInvitationScope'),
          ),
        );
        return false;
      }

      const acceptedInvitation = acceptInvitationResult.data;
      const successMessage = acceptedInvitation.alreadyAccepted
        ? t('invitationAlreadyAccepted')
        : t('invitationAccepted');
      const roomId = acceptedInvitation.room?.id ?? acceptedInvitation.roomId;

      if (!roomId) {
        toast.warning(t('roomUnavailableAfterAccept', { message: successMessage }));
        return true;
      }

      let roomType = acceptedInvitation.room?.roomType;

      if (!roomType) {
        try {
          roomType = await resolveRoomType(roomId);
        } catch {
          roomType = undefined;
        }
      }

      openResolvedRoom(roomId, roomType ?? 'dm');
      return true;
    },
    [acceptInvitation, openResolvedRoom, resolveRoomType, t],
  );

  return {
    handleMarkConversationUnread,
    handleRemoveMember,
    handleUpdateMemberRole,
    handleInviteMembers,
    handleJoinPublicRoom,
    handleMarkAllMentionsRead,
    handleMarkAllNotificationsRead,
    handleMarkAllUnreadActivities,
    handleAcceptInvitation,
  };
}
