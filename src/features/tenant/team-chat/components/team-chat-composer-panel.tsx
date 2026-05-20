import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { EditorContent, useEditor } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EmojiStyle, type EmojiClickData } from 'emoji-picker-react';
import {
  AtSign,
  Bold,
  Code2,
  Italic,
  List,
  ListOrdered,
  Lock,
  Paperclip,
  Smile,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type ConversationKey } from '../data/team-chat-ui-data';
import {
  emojiPickerStyle,
  focusRingClass,
  type ComposerAttachmentDraft,
  type ComposerState,
  type MentionCandidate,
  type TeamChatComposerDraftPayload,
} from '../lib/team-chat-screen.shared';
import { useTeamChatComposerDraftSync } from '../hooks/use-team-chat-composer-draft-sync';
import {
  buildTeamChatUploadDedupKey,
  normalizeTeamChatClipboardFiles,
  TEAM_CHAT_UPLOAD_ACCEPT,
} from '../lib/team-chat-upload.utils';
import {
  areTeamChatComposerDraftPayloadEqual,
  cloneTeamChatComposerDraftPayload,
  createEmptyTeamChatComposerDraftPayload,
  normalizeTeamChatComposerDraftPayload,
} from '../lib/team-chat-composer-draft-payload.utils';
import {
  createTeamChatComposerPayloadFromEditor,
  getTeamChatComposerMentionMatch,
  resolveTeamChatComposerEditorContent,
} from '../lib/team-chat-composer-rich-text.utils';
import { TeamChatComposerSpecialMentionHighlight } from '../lib/team-chat-composer-special-mention-highlight.extension';
import { TeamChatComposerMentionToken } from '../lib/team-chat-composer-mention-token.extension';
import { TeamChatComposerAttachmentStrip } from './team-chat-composer-attachment-strip';
import { TeamChatComposerMessageLinkPreviewList } from './team-chat-composer-message-link-preview-list';
import { TeamChatComposerDropOverlay } from './team-chat-composer-drop-overlay';
import { TeamChatComposerMentionPickerItem } from './team-chat-composer-mention-picker-item';
import { TeamChatComposerSendControls } from './team-chat-composer-send-controls';
import {
  ComposerIconButton,
  ComposerToolbarButton,
} from './team-chat-composer-toolbar-controls';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

function eventHasFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

function normalizeMentionCandidateLabel(candidate: MentionCandidate) {
  const normalizedName = candidate.name.trim();
  if (normalizedName) return normalizedName;
  const normalizedDisplayName = candidate.displayName?.trim();
  if (normalizedDisplayName) return normalizedDisplayName;
  return '';
}

export interface TeamChatComposerPanelProps {
  activeConversationPlaceholder: string;
  canSendMessage?: boolean;
  composerAttachments: ComposerAttachmentDraft[];
  draftSeedValue: string;
  draftSeedPayload: TeamChatComposerDraftPayload;
  composerResetKey: number;
  composerState: ComposerState | null;
  conversationKey: ConversationKey;
  mentionCandidates: MentionCandidate[];
  mentionContextKind: 'channel' | 'dm' | 'group_dm';
  readOnlyVariant?: 'default' | 'announcements';
  onCancelComposer: () => void;
  onComposerAttachmentRemove: (attachmentId: string) => void;
  onComposerAttachmentSelect: (files: File[]) => void;
  onDraftChange: (payload: TeamChatComposerDraftPayload) => void;
  onDraftPresenceChange: (hasText: boolean) => void;
  onOpenMessageLink?: (href: string) => void;
  onSchedule: (payload: TeamChatComposerDraftPayload, scheduledFor: Date) => void;
  onSend: (payload: TeamChatComposerDraftPayload) => void;
}

export function TeamChatComposerPanel({
  activeConversationPlaceholder,
  canSendMessage = true,
  composerAttachments,
  draftSeedValue,
  draftSeedPayload,
  composerResetKey,
  composerState,
  conversationKey,
  mentionCandidates,
  mentionContextKind,
  readOnlyVariant = 'default',
  onCancelComposer,
  onComposerAttachmentRemove,
  onComposerAttachmentSelect,
  onDraftChange,
  onDraftPresenceChange,
  onOpenMessageLink,
  onSchedule,
  onSend,
}: TeamChatComposerPanelProps) {
  const t = useTranslations('teamChat');
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const lastDraftHasTextRef = useRef(false);
  const lastClipboardPasteRef = useRef<{ signature: string; at: number } | null>(null);
  const lastConversationKeyRef = useRef<ConversationKey | null>(null);
  const lastComposerResetKeyRef = useRef<number | null>(null);
  const onComposerAttachmentSelectRef = useRef(onComposerAttachmentSelect);
  const [composerFocused, setComposerFocused] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [dismissedMentionKey, setDismissedMentionKey] = useState<string | null>(null);
  const [isComposerDragActive, setIsComposerDragActive] = useState(false);
  const [isComposerComposing, setIsComposerComposing] = useState(false);
  const [, setSelectionVersion] = useState(0);

  const normalizedDraftSeedPayload = useMemo(() => {
    const nextPayload = normalizeTeamChatComposerDraftPayload(draftSeedPayload);
    if (!nextPayload.content && draftSeedValue.trim().length > 0) {
      return normalizeTeamChatComposerDraftPayload({ content: draftSeedValue });
    }
    return nextPayload;
  }, [draftSeedPayload, draftSeedValue]);
  const [draftPayload, setDraftPayload] = useState<TeamChatComposerDraftPayload>(
    normalizedDraftSeedPayload,
  );
  const normalizedDraftSeedPayloadRef = useRef(normalizedDraftSeedPayload);
  const draftPayloadRef = useRef(normalizedDraftSeedPayload);
  const isComposerComposingRef = useRef(false);
  const { markDraftAsSynced, syncDraftNow } = useTeamChatComposerDraftSync({
    draftPayload,
    draftSeedPayload: normalizedDraftSeedPayload,
    onDraftChange,
  });

  const syncDraftPresence = useCallback(
    (value: string) => {
      const nextHasText = value.trim().length > 0;
      if (lastDraftHasTextRef.current === nextHasText) return;
      lastDraftHasTextRef.current = nextHasText;
      onDraftPresenceChange(nextHasText);
    },
    [onDraftPresenceChange],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          blockquote: false,
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          codeBlock: false,
          heading: false,
          horizontalRule: false,
          link: false,
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
          underline: false,
          dropcursor: false,
        }),
        Underline,
        TeamChatComposerMentionToken,
        TeamChatComposerSpecialMentionHighlight,
        Link.configure({
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
        }),
        Placeholder.configure({
          placeholder: activeConversationPlaceholder,
        }),
      ],
      content: resolveTeamChatComposerEditorContent(normalizedDraftSeedPayload),
      editable: canSendMessage,
      editorProps: {
        attributes: {
          class:
            'selection:bg-primary selection:text-primary-foreground text-foreground caret-foreground relative z-10 w-full cursor-text border-0 bg-transparent px-4 py-3 text-sm leading-6 outline-none overscroll-contain [scrollbar-gutter:stable] max-h-56 overflow-y-auto whitespace-pre-wrap break-words [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p]:min-h-[1.5rem] [&_p]:break-words [&_p]:whitespace-pre-wrap [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_li]:break-words [&_li_p]:min-h-0 [&_[data-team-chat-mention-token]]:box-decoration-clone [&_[data-team-chat-mention-token]]:rounded-md [&_[data-team-chat-mention-token]]:bg-sky-500/16 [&_[data-team-chat-mention-token]]:px-1 [&_[data-team-chat-mention-token]]:py-0.5 [&_[data-team-chat-mention-token]]:font-medium [&_[data-team-chat-mention-token]]:text-sky-300 [&_[data-team-chat-mention-token]]:ring-1 [&_[data-team-chat-mention-token]]:ring-inset [&_[data-team-chat-mention-token]]:ring-sky-500/25 [&_code]:rounded-md [&_code]:border [&_code]:border-amber-400/20 [&_code]:bg-[#221b12] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em] [&_code]:text-amber-200',
          'aria-label': t('composerSend.sendMessage'),
        },
      },
      onUpdate: ({ editor: nextEditor }) => {
        if (isComposerComposingRef.current) return;
        const nextPayload = createTeamChatComposerPayloadFromEditor(nextEditor);
        syncDraftNow(nextPayload);
        setDraftPayload((currentPayload) =>
          areTeamChatComposerDraftPayloadEqual(currentPayload, nextPayload)
            ? currentPayload
            : nextPayload,
        );
        syncDraftPresence(nextPayload.content);
      },
      onSelectionUpdate: () => {
        setSelectionVersion((previous) => previous + 1);
      },
    },
    [activeConversationPlaceholder, canSendMessage, syncDraftNow],
  );

  useEffect(() => {
    onComposerAttachmentSelectRef.current = onComposerAttachmentSelect;
  }, [onComposerAttachmentSelect]);

  useEffect(() => {
    draftPayloadRef.current = draftPayload;
  }, [draftPayload]);

  useEffect(() => {
    normalizedDraftSeedPayloadRef.current = normalizedDraftSeedPayload;
  }, [normalizedDraftSeedPayload]);

  useEffect(() => {
    isComposerComposingRef.current = isComposerComposing;
  }, [isComposerComposing]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(canSendMessage);
  }, [canSendMessage, editor]);

  const resetComposerShell = useCallback(
    (nextPayload: TeamChatComposerDraftPayload, shouldFocus: boolean) => {
      const normalizedNextPayload = normalizeTeamChatComposerDraftPayload(nextPayload);
      markDraftAsSynced(normalizedNextPayload);
      setDraftPayload(normalizedNextPayload);
      syncDraftPresence(normalizedNextPayload.content);
      setComposerFocused(false);
      setActiveMentionIndex(0);
      setDismissedMentionKey(null);
      setIsComposerDragActive(false);
      setIsComposerComposing(false);
      dragDepthRef.current = 0;
      lastClipboardPasteRef.current = null;

      if (!editor) return;
      editor.commands.setContent(
        resolveTeamChatComposerEditorContent(normalizedNextPayload),
      );
      if (shouldFocus) {
        editor.commands.focus('end');
      }
    },
    [editor, markDraftAsSynced, syncDraftPresence],
  );

  useEffect(() => {
    if (!editor) return;
    if (lastConversationKeyRef.current === conversationKey) return;
    lastConversationKeyRef.current = conversationKey;
    const frameId = window.requestAnimationFrame(() => {
      resetComposerShell(normalizedDraftSeedPayloadRef.current, false);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [conversationKey, editor, resetComposerShell]);

  useEffect(() => {
    if (!editor) return;
    if (lastComposerResetKeyRef.current === composerResetKey) return;
    lastComposerResetKeyRef.current = composerResetKey;
    const frameId = window.requestAnimationFrame(() => {
      resetComposerShell(normalizedDraftSeedPayloadRef.current, true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [composerResetKey, editor, resetComposerShell]);

  useEffect(() => {
    if (!editor || !composerState) return;
    editor.commands.focus('end');
  }, [composerState, editor]);

  const mentionMatch = composerFocused ? getTeamChatComposerMentionMatch(editor) : null;
  const mentionMatchKey = mentionMatch
    ? `${mentionMatch.from}:${mentionMatch.query}`
    : null;
  const filteredMentionCandidates = useMemo(() => {
    if (!mentionMatch) return [];
    const normalizedQuery = mentionMatch.query.trim().toLowerCase();
    return mentionCandidates
      .filter((candidate) => {
        if (!normalizedQuery) return true;
        return [candidate.name, candidate.displayName, candidate.role]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      })
      .slice(0, 8);
  }, [mentionCandidates, mentionMatch]);
  const mentionPickerOpen = Boolean(
    composerFocused &&
    mentionMatch &&
    (mentionMatch.query.length === 0 || dismissedMentionKey !== mentionMatchKey),
  );
  const resolvedActiveMentionIndex = filteredMentionCandidates.length
    ? Math.min(activeMentionIndex, filteredMentionCandidates.length - 1)
    : 0;
  const deferredDraftForLinkPreview = useDeferredValue(draftPayload.content);
  const focusComposerInput = useCallback(() => {
    editor?.chain().focus().run();
  }, [editor]);

  const applyMentionCandidate = useCallback(
    (candidate: MentionCandidate) => {
      if (!editor || !mentionMatch) return;
      if (candidate.kind === 'special' && candidate.specialMentionType) {
        const specialMentionToken =
          candidate.specialMentionType === 'channel' ? '@channel' : '@everyone';
        editor
          .chain()
          .focus()
          .insertContentAt(
            {
              from: mentionMatch.from,
              to: mentionMatch.to,
            },
            `${specialMentionToken} `,
          )
          .run();
        setDismissedMentionKey(null);
        setActiveMentionIndex(0);
        setSelectionVersion((previous) => previous + 1);
        return;
      }

      const mentionLabel = normalizeMentionCandidateLabel(candidate);
      editor
        .chain()
        .focus()
        .insertContentAt(
          {
            from: mentionMatch.from,
            to: mentionMatch.to,
          },
          [
            {
              type: 'mention',
              attrs: {
                id: candidate.id,
                label: mentionLabel,
                name: candidate.name,
                displayName: candidate.displayName ?? null,
              },
            },
            { type: 'text', text: ' ' },
          ],
        )
        .run();
      setDismissedMentionKey(null);
      setActiveMentionIndex(0);
      setSelectionVersion((previous) => previous + 1);
    },
    [editor, mentionMatch],
  );

  const insertMentionTrigger = () => {
    if (!editor) return;
    const { selection } = editor.state;
    const parentText = selection.$from.parent.textContent;
    const beforeCaret = parentText.slice(0, selection.$from.parentOffset);
    const needsLeadingSpace =
      beforeCaret.length > 0 && !/\s/.test(beforeCaret[beforeCaret.length - 1] ?? '')
        ? ' '
        : '';
    editor.chain().focus().insertContent(`${needsLeadingSpace}@`).run();
    setDismissedMentionKey(null);
    setActiveMentionIndex(0);
    setSelectionVersion((previous) => previous + 1);
  };

  const insertEmojiIntoComposer = (emojiData: EmojiClickData) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emojiData.emoji).run();
  };

  const triggerSend = useCallback(() => {
    const outgoingPayload = cloneTeamChatComposerDraftPayload(draftPayloadRef.current);
    const hasPayload =
      outgoingPayload.content.trim().length > 0 || composerAttachments.length > 0;
    if (!hasPayload) return;
    resetComposerShell(createEmptyTeamChatComposerDraftPayload(), true);
    onSend(outgoingPayload);
  }, [composerAttachments.length, onSend, resetComposerShell]);

  const triggerSchedule = (scheduledFor: Date) => {
    const outgoingPayload = cloneTeamChatComposerDraftPayload(draftPayloadRef.current);
    if (!outgoingPayload.content.trim().length) return;
    onSchedule(outgoingPayload, scheduledFor);
  };

  const openAttachmentPicker = () => {
    attachmentInputRef.current?.click();
  };

  const resetComposerDragState = () => {
    dragDepthRef.current = 0;
    setIsComposerDragActive(false);
  };

  const handleComposerDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!eventHasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    setIsComposerDragActive(true);
  };

  const handleComposerDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!eventHasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    if (!isComposerDragActive) {
      setIsComposerDragActive(true);
    }
  };

  const handleComposerDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!eventHasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsComposerDragActive(false);
    }
  };

  const handleComposerDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!eventHasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const selectedFiles = Array.from(event.dataTransfer.files ?? []);
    resetComposerDragState();
    if (selectedFiles.length > 0) {
      onComposerAttachmentSelect(selectedFiles);
      focusComposerInput();
    }
  };

  const handleComposerEditorKeyDown = useCallback(
    (event: globalThis.KeyboardEvent | KeyboardEvent<HTMLDivElement>) => {
      const isEventComposing =
        'nativeEvent' in event ? event.nativeEvent.isComposing : event.isComposing;
      if (isEventComposing || isComposerComposingRef.current) return false;

      if (mentionPickerOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const totalCandidates = filteredMentionCandidates.length;
          if (totalCandidates > 0) {
            setActiveMentionIndex((currentIndex) =>
              currentIndex >= totalCandidates - 1 ? 0 : currentIndex + 1,
            );
          }
          return true;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const totalCandidates = filteredMentionCandidates.length;
          if (totalCandidates > 0) {
            setActiveMentionIndex((currentIndex) =>
              currentIndex <= 0 ? totalCandidates - 1 : currentIndex - 1,
            );
          }
          return true;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          const activeCandidate = filteredMentionCandidates[resolvedActiveMentionIndex];
          if (activeCandidate) {
            applyMentionCandidate(activeCandidate);
          }
          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          if (mentionMatch) {
            setDismissedMentionKey(`${mentionMatch.from}:${mentionMatch.query}`);
          }
          return true;
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) {
          if (editor?.isActive('orderedList') || editor?.isActive('bulletList')) {
            editor.chain().focus().splitListItem('listItem').run();
            return true;
          }
          editor?.chain().focus().splitBlock().run();
          return true;
        }
        triggerSend();
        return true;
      }

      return false;
    },
    [
      applyMentionCandidate,
      editor,
      filteredMentionCandidates,
      mentionMatch,
      mentionPickerOpen,
      resolvedActiveMentionIndex,
      triggerSend,
    ],
  );

  const handleComposerPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const itemFiles = Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null && file.size > 0);
    const fallbackFiles = Array.from(event.clipboardData?.files ?? []).filter(
      (file): file is File => file.size > 0,
    );
    const seenRawFileKeys = new Set<string>();
    const rawClipboardFiles = [...itemFiles, ...fallbackFiles].filter((file) => {
      const fileKey = buildTeamChatUploadDedupKey(file);
      if (seenRawFileKeys.has(fileKey)) return false;
      seenRawFileKeys.add(fileKey);
      return true;
    });
    if (!rawClipboardFiles.length) return;

    const pasteSignature = rawClipboardFiles
      .map((file) => buildTeamChatUploadDedupKey(file))
      .sort()
      .join('|');
    const currentPasteAt = Date.now();
    const lastPaste = lastClipboardPasteRef.current;
    if (
      lastPaste &&
      lastPaste.signature === pasteSignature &&
      currentPasteAt - lastPaste.at < 250
    ) {
      event.preventDefault();
      return;
    }

    lastClipboardPasteRef.current = {
      signature: pasteSignature,
      at: currentPasteAt,
    };

    const seenNormalizedFileKeys = new Set<string>();
    const normalizedFiles = normalizeTeamChatClipboardFiles(rawClipboardFiles).filter(
      (file) => {
        const fileKey = buildTeamChatUploadDedupKey(file);
        if (seenNormalizedFileKeys.has(fileKey)) return false;
        seenNormalizedFileKeys.add(fileKey);
        return true;
      },
    );
    if (!normalizedFiles.length) return;

    event.preventDefault();
    onComposerAttachmentSelectRef.current(normalizedFiles);
  };

  const composerReplyBanner = composerState ? (
    <div className="border-border bg-muted/35 mb-2 flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
      <div className="min-w-0">
        <p className="text-foreground font-semibold">
          {t('composer.replyingTo', { author: composerState.message.author })}
        </p>
        <p className="text-muted-foreground truncate">
          {composerState.message.isAttachmentPlaceholder ||
          (composerState.message.content.trim().toLowerCase() === 'attachment' &&
            composerState.message.attachments?.length)
            ? t('composer.mediaAttachment')
            : composerState.message.content}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancelComposer}
        className={cn(
          'text-muted-foreground hover:bg-muted hover:text-foreground ml-3 cursor-pointer rounded-md px-2 py-1 transition-colors',
          focusRingClass,
        )}
      >
        {t('common.cancel')}
      </button>
    </div>
  ) : null;

  const composerReadOnlyTitle =
    readOnlyVariant === 'announcements'
      ? t('composer.readOnly.announcementsTitle')
      : t('composer.readOnly.defaultTitle');
  const composerReadOnlyDescription =
    readOnlyVariant === 'announcements'
      ? t('composer.readOnly.announcementsDescription')
      : mentionContextKind === 'dm'
        ? t('composer.readOnly.dmDescription')
        : t('composer.readOnly.roomDescription');
  const hasSavedDraftContent =
    draftPayload.content.trim().length > 0 || composerAttachments.length > 0;

  if (!canSendMessage) {
    return (
      <div className="bg-background shrink-0 px-4 pt-3 pb-4 sm:px-6">
        <div className="border-border/90 bg-background relative mx-auto rounded-2xl border shadow-[0_18px_34px_-22px_rgba(15,23,42,0.45)] dark:shadow-black/45">
          <div className="px-3 py-3">
            {composerReplyBanner}
            <div className="border-border bg-muted/25 flex items-start gap-3 rounded-xl border px-4 py-4">
              <div className="bg-background border-border flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
                <Lock className="text-muted-foreground h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">
                  {composerReadOnlyTitle}
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {composerReadOnlyDescription}
                </p>
                {hasSavedDraftContent ? (
                  <div className="border-border bg-background/80 mt-3 rounded-xl border px-3 py-2.5">
                    <p className="text-foreground text-xs font-medium">
                      {t('composer.savedDraftTitle')}
                    </p>
                    {draftPayload.content.trim().length > 0 ? (
                      <p className="text-muted-foreground mt-1 text-xs leading-5 break-words whitespace-pre-wrap">
                        {draftPayload.content.trim()}
                      </p>
                    ) : null}
                    {composerAttachments.length > 0 ? (
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {t('composer.savedDraftAttachments', { count: composerAttachments.length })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={140}>
      <div className="bg-background shrink-0 px-4 pt-3 pb-4 sm:px-6">
        <div
          className="border-border/90 bg-background focus-within:border-primary/50 relative mx-auto rounded-2xl border shadow-[0_18px_34px_-22px_rgba(15,23,42,0.45)] transition-colors dark:shadow-black/45"
          onDragEnter={handleComposerDragEnter}
          onDragOver={handleComposerDragOver}
          onDragLeave={handleComposerDragLeave}
          onDrop={handleComposerDrop}
        >
          <TeamChatComposerDropOverlay visible={isComposerDragActive} />
          <div className="border-border border-b px-3 py-2">
            {composerReplyBanner}

            <TeamChatComposerAttachmentStrip
              attachments={composerAttachments}
              onRemove={onComposerAttachmentRemove}
            />

            <TeamChatComposerMessageLinkPreviewList
              draft={deferredDraftForLinkPreview}
              onOpenLink={onOpenMessageLink}
            />

            <div className="flex flex-wrap items-center gap-1">
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.bold')}
                tooltip={t('composer.toolbar.bold')}
                active={editor?.isActive('bold')}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold className="h-4 w-4" />
              </ComposerToolbarButton>
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.italic')}
                tooltip={t('composer.toolbar.italic')}
                active={editor?.isActive('italic')}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-4 w-4" />
              </ComposerToolbarButton>
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.underline')}
                tooltip={t('composer.toolbar.underline')}
                active={editor?.isActive('underline')}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon className="h-4 w-4" />
              </ComposerToolbarButton>
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.strikethrough')}
                tooltip={t('composer.toolbar.strikethrough')}
                active={editor?.isActive('strike')}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
              >
                <Strikethrough className="h-4 w-4" />
              </ComposerToolbarButton>
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.numberedList')}
                tooltip={t('composer.toolbar.numberedList')}
                active={editor?.isActive('orderedList')}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
              </ComposerToolbarButton>
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.bulletList')}
                tooltip={t('composer.toolbar.bulletList')}
                active={editor?.isActive('bulletList')}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
              </ComposerToolbarButton>
              <ComposerToolbarButton
                ariaLabel={t('composer.toolbar.inlineCode')}
                tooltip={t('composer.toolbar.inlineCode')}
                active={editor?.isActive('code')}
                onClick={() => editor?.chain().focus().toggleCode().run()}
              >
                <Code2 className="h-4 w-4" />
              </ComposerToolbarButton>
            </div>
          </div>

          <div className="relative">
            <EditorContent
              editor={editor}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              onKeyDownCapture={(event) => {
                if (handleComposerEditorKeyDown(event)) {
                  event.stopPropagation();
                }
              }}
              onPaste={handleComposerPaste}
              onCompositionStart={() => {
                isComposerComposingRef.current = true;
                setIsComposerComposing(true);
              }}
              onCompositionEnd={() => {
                isComposerComposingRef.current = false;
                setIsComposerComposing(false);
                if (!editor) return;
                const nextPayload = createTeamChatComposerPayloadFromEditor(editor);
                syncDraftNow(nextPayload);
                setDraftPayload((currentPayload) =>
                  areTeamChatComposerDraftPayloadEqual(currentPayload, nextPayload)
                    ? currentPayload
                    : nextPayload,
                );
                syncDraftPresence(nextPayload.content);
              }}
              className={cn(composerState ? 'min-h-[88px]' : 'min-h-11')}
            />

            {mentionPickerOpen ? (
              <div className="absolute right-4 bottom-3 left-4 z-20 sm:right-auto sm:left-4 sm:max-w-[460px]">
                <div className="border-border bg-popover overflow-hidden rounded-2xl border shadow-2xl">
                  <ScrollArea className="max-h-[320px]">
                    <div className="divide-border divide-y">
                      {filteredMentionCandidates.length ? (
                        filteredMentionCandidates.map((candidate, index) => {
                          const isActive = index === resolvedActiveMentionIndex;

                          return (
                            <TeamChatComposerMentionPickerItem
                              key={candidate.id}
                              candidate={candidate}
                              isActive={isActive}
                              mentionContextKind={mentionContextKind}
                              onApply={applyMentionCandidate}
                            />
                          );
                        })
                      ) : (
                        <div className="text-muted-foreground px-4 py-8 text-center text-sm">
                          {t('composer.mention.empty')}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1">
              <ComposerIconButton
                ariaLabel={t('composer.actions.attachFiles')}
                tooltip={t('composer.actions.attachFiles')}
                onClick={openAttachmentPicker}
              >
                <Paperclip className="h-4 w-4" />
              </ComposerIconButton>
              <input
                ref={attachmentInputRef}
                type="file"
                className="hidden"
                multiple
                accept={TEAM_CHAT_UPLOAD_ACCEPT}
                onChange={(event) => {
                  const selectedFiles = Array.from(event.target.files ?? []);
                  if (!selectedFiles.length) return;
                  onComposerAttachmentSelect(selectedFiles);
                  event.currentTarget.value = '';
                }}
              />

              <ComposerIconButton
                ariaLabel={t('composer.actions.mentionSomeone')}
                tooltip={t('composer.actions.mentionSomeone')}
                onClick={insertMentionTrigger}
              >
                <AtSign className="h-4 w-4" />
              </ComposerIconButton>

              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t('composer.actions.insertEmoji')}
                        className={cn(
                          'text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors',
                          focusRingClass,
                        )}
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {t('composer.actions.emoji')}
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="start"
                  className="border-border bg-popover w-auto rounded-2xl border p-0 shadow-2xl"
                >
                  <EmojiPicker
                    emojiStyle={EmojiStyle.NATIVE}
                    width={320}
                    height={380}
                    previewConfig={{ showPreview: false }}
                    searchPlaceholder={t('composer.actions.searchEmoji')}
                    style={emojiPickerStyle}
                    onEmojiClick={(emojiData) => insertEmojiIntoComposer(emojiData)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <TeamChatComposerSendControls
              canSend={
                draftPayload.content.trim().length > 0 || composerAttachments.length > 0
              }
              scheduleDisabled={composerAttachments.length > 0}
              onSend={triggerSend}
              onSchedule={triggerSchedule}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
