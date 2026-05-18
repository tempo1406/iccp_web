'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Globe, Layers, Library, Plus, Send, Square } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from './searchable-select';
import { cn } from '@/lib/utils';
import { useServiceContext } from '@/lib/use-service-context';
import { DocumentsService } from '@/services/documents/documents.service';
import type {
  CategoryResponse,
  DocumentTreeResponse,
  FolderTreeResponse,
} from '@/services/documents/types/documents.types';
import { ProjectsService } from '@/services/projects/projects.service';
import type { ProjectResponse } from '@/services/projects/types/project.types';
import {
  getUserDailyTokenUsedPercentage,
  resolveUserDailyTokenBudget,
} from '../utils/org-token-pool';
import {
  getChatToolsetLabels,
  parseChatToolset,
} from '../constants/chat-toolset';
import type {
  ChatContextScope,
  ChatMode,
  ChatToolset,
  QuotaMeDto,
} from '../types';
import {
  applyConfigToParams,
  deriveLegacyConfigFromCapabilities,
  readSearchConfigFromParams,
  type ChatSearchConfigState,
} from '../utils/chat-config';

const TOOLSET_ORDER: ChatToolset[] = [
  'auto',
  'none',
  'projects',
  'tasks',
  'tickets',
  'documents',
  'organization',
  'daily_reports',
];

const INTERNAL_TOOLSET_OPTIONS = TOOLSET_ORDER.filter((toolset) => toolset !== 'none');
const SCOPE_REQUIRES_ID: ChatContextScope[] = ['project', 'folder', 'document'];

interface ScopeOption {
  id: string;
  label: string;
}

function flattenFolderOptions(
  folders: FolderTreeResponse[],
  parentPath = '',
): ScopeOption[] {
  const result: ScopeOption[] = [];

  for (const folder of folders) {
    const currentPath = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
    result.push({ id: folder.id, label: currentPath });
    result.push(...flattenFolderOptions(folder.children, currentPath));
  }

  return result;
}

function flattenDocumentOptions(tree: DocumentTreeResponse): ScopeOption[] {
  const result: ScopeOption[] = [];

  for (const rootDoc of tree.rootDocuments) {
    result.push({ id: rootDoc.id, label: rootDoc.title });
  }

  const walk = (folders: FolderTreeResponse[], parentPath = '') => {
    for (const folder of folders) {
      const currentPath = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
      for (const doc of folder.documents) {
        result.push({ id: doc.id, label: `${currentPath} / ${doc.title}` });
      }
      walk(folder.children, currentPath);
    }
  };

  walk(tree.folders);
  return result;
}

function collectFileTypeOptions(tree: DocumentTreeResponse): ScopeOption[] {
  const fileTypes = new Set<string>();

  for (const rootDoc of tree.rootDocuments) {
    if (rootDoc.fileType) fileTypes.add(rootDoc.fileType);
  }

  const walk = (folders: FolderTreeResponse[]) => {
    for (const folder of folders) {
      for (const doc of folder.documents) {
        if (doc.fileType) fileTypes.add(doc.fileType);
      }
      walk(folder.children);
    }
  };

  walk(tree.folders);

  return Array.from(fileTypes)
    .sort((a, b) => a.localeCompare(b))
    .map((type) => ({ id: type, label: type.toUpperCase() }));
}

function QuotaBadge({ quota }: { quota: QuotaMeDto }) {
  const t = useTranslations('chatbot');
  const locale = useLocale();
  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const dailyLeft = quota.user.daily_message_limit - quota.user.daily_messages_used;
  const dailyTokenBudget = resolveUserDailyTokenBudget(quota);
  const usedPercentage = Math.round(getUserDailyTokenUsedPercentage(dailyTokenBudget));
  const isLow =
    dailyLeft <= 5 || (dailyTokenBudget != null && dailyTokenBudget.remaining <= 0);

  const tooltip = [
    t('quota.tooltipMessages', {
      used: quota.user.daily_messages_used,
      limit: quota.user.daily_message_limit,
    }),
    dailyTokenBudget
      ? t('quota.tooltipTokens', {
          used: dailyTokenBudget.used.toLocaleString(intlLocale),
          limit: dailyTokenBudget.limit.toLocaleString(intlLocale),
        })
      : t('quota.tooltipTokensUnavailable'),
  ].join('\n');

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
        isLow
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'bg-muted/60 text-muted-foreground',
      )}
      title={tooltip}
    >
      <span className="font-medium">
        {dailyTokenBudget ? `${usedPercentage}%` : `${dailyLeft}`}
      </span>
      <span className="opacity-70">
        {dailyTokenBudget
          ? t('quota.tokensUsedSuffix')
          : t('quota.todaySuffix', { limit: quota.user.daily_message_limit })}
      </span>
    </div>
  );
}

interface ChatbotInputBarProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  toolset: ChatToolset;
  onToolsetChange: (toolset: ChatToolset) => void;
  onConversationConfigChange?: (config: ChatSearchConfigState) => void | Promise<void>;
  onSend: (content: string) => void;
  isStreaming: boolean;
  onAbort?: () => void;
  disabled?: boolean;
  quota?: QuotaMeDto | null;
}

export function ChatbotInputBar({
  mode,
  onModeChange,
  toolset,
  onToolsetChange,
  onConversationConfigChange,
  onSend,
  isStreaming,
  onAbort,
  disabled,
  quota,
}: ChatbotInputBarProps) {
  const t = useTranslations('chatbot');
  const ctx = useServiceContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  const [isCapabilityPopoverOpen, setIsCapabilityPopoverOpen] = useState(false);
  const [isExternalPopoverOpen, setIsExternalPopoverOpen] = useState(false);
  const [dialogCategory, setDialogCategory] = useState<'rag' | 'toolset'>('rag');
  const [projectOptions, setProjectOptions] = useState<ScopeOption[]>([]);
  const [folderOptions, setFolderOptions] = useState<ScopeOption[]>([]);
  const [documentOptions, setDocumentOptions] = useState<ScopeOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<ScopeOption[]>([]);
  const [fileTypeOptions, setFileTypeOptions] = useState<ScopeOption[]>([]);
  const [isScopeOptionsLoading, setIsScopeOptionsLoading] = useState(false);
  const [scopeOptionsError, setScopeOptionsError] = useState<string | null>(null);

  const currentSearchConfig = useMemo(
    () =>
      readSearchConfigFromParams(
        new URLSearchParams(searchParams.toString()),
        mode,
        toolset,
      ),
    [mode, searchParams, toolset],
  );
  const [draftConfig, setDraftConfig] = useState<ChatSearchConfigState>(currentSearchConfig);
  const [capabilityDraft, setCapabilityDraft] = useState<
    Pick<ChatSearchConfigState, 'internalEnabled' | 'externalEnabled' | 'externalMode'>
  >({
    internalEnabled: currentSearchConfig.internalEnabled,
    externalEnabled: currentSearchConfig.externalEnabled,
    externalMode: currentSearchConfig.externalMode,
  });

  const toolsetLabels = getChatToolsetLabels(t);
  const documentsService = useMemo(() => new DocumentsService(ctx), [ctx]);
  const projectsService = useMemo(() => new ProjectsService(ctx), [ctx]);

  const loadScopeOptions = useCallback(async () => {
    setIsScopeOptionsLoading(true);
    setScopeOptionsError(null);

    try {
      const [projectsResult, treeResult, categoriesResult] = await Promise.allSettled([
        projectsService.listProjects({ page: 1, limit: 200 }),
        documentsService.getTree(),
        documentsService.listCategories(),
      ]);

      const projectScopeOptions: ScopeOption[] =
        projectsResult.status === 'fulfilled'
          ? (projectsResult.value as ProjectResponse[]).map((project) => ({
              id: project.id,
              label: project.name,
            }))
          : [];

      const folderScopeOptions =
        treeResult.status === 'fulfilled'
          ? flattenFolderOptions(treeResult.value.folders)
          : [];

      const documentScopeOptions =
        treeResult.status === 'fulfilled' ? flattenDocumentOptions(treeResult.value) : [];

      const fileTypeScopeOptions =
        treeResult.status === 'fulfilled' ? collectFileTypeOptions(treeResult.value) : [];

      const categoryScopeOptions =
        categoriesResult.status === 'fulfilled'
          ? categoriesResult.value.map((category: CategoryResponse) => ({
              id: category.id,
              label: category.name,
            }))
          : [];

      setProjectOptions(projectScopeOptions);
      setFolderOptions(folderScopeOptions);
      setDocumentOptions(documentScopeOptions);
      setCategoryOptions(categoryScopeOptions);
      setFileTypeOptions(fileTypeScopeOptions);

      if (projectsResult.status === 'rejected' || treeResult.status === 'rejected') {
        setScopeOptionsError(t('input.configDialog.scopeOptionsError'));
      }
    } catch {
      setScopeOptionsError(t('input.configDialog.scopeOptionsError'));
    } finally {
      setIsScopeOptionsLoading(false);
    }
  }, [documentsService, projectsService, t]);

  const applyUrlConfig = useCallback(
    (rawConfig: ChatSearchConfigState) => {
      const effectiveConfig = deriveLegacyConfigFromCapabilities(rawConfig);
      const params = new URLSearchParams(searchParams.toString());
      applyConfigToParams(params, effectiveConfig);
      onModeChange(effectiveConfig.mode);
      onToolsetChange(effectiveConfig.toolset);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      void onConversationConfigChange?.(effectiveConfig);
    },
    [
      onConversationConfigChange,
      onModeChange,
      onToolsetChange,
      pathname,
      router,
      searchParams,
    ],
  );

  const handleInternalDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsInternalDialogOpen(open);
      if (!open) return;

      setDraftConfig({
        ...currentSearchConfig,
        internalEnabled: true,
      });
      setDialogCategory(currentSearchConfig.toolset !== 'none' ? 'toolset' : 'rag');
      void loadScopeOptions();
    },
    [currentSearchConfig, loadScopeOptions],
  );

  const applyCapabilitySelection = useCallback(() => {
    applyUrlConfig({
      ...currentSearchConfig,
      internalEnabled: capabilityDraft.internalEnabled,
      externalEnabled: capabilityDraft.externalEnabled,
      externalMode: capabilityDraft.externalMode,
    });
    setIsCapabilityPopoverOpen(false);
  }, [applyUrlConfig, capabilityDraft, currentSearchConfig]);

  const applyInternalConfig = useCallback(() => {
    const baseConfig: ChatSearchConfigState = {
      ...draftConfig,
      internalEnabled: true,
    };

    const nextConfig: ChatSearchConfigState =
      dialogCategory === 'rag'
        ? {
            ...baseConfig,
            toolset: 'none',
          }
        : {
            ...baseConfig,
            toolset:
              parseChatToolset(baseConfig.toolset) === 'none'
                ? 'auto'
                : baseConfig.toolset,
          };

    applyUrlConfig(nextConfig);
    setIsInternalDialogOpen(false);
  }, [applyUrlConfig, dialogCategory, draftConfig]);

  const handleExternalModeChange = useCallback(
    (value: string) => {
      if (value === 'off') {
        applyUrlConfig({
          ...currentSearchConfig,
          externalEnabled: false,
        });
        return;
      }

      applyUrlConfig({
        ...currentSearchConfig,
        externalEnabled: true,
        externalMode: 'web_search',
      });
    },
    [applyUrlConfig, currentSearchConfig],
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  });

  const handleSend = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || isStreaming) return;
    onSend(value);
    if (!textareaRef.current) return;
    textareaRef.current.value = '';
    textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const scopeLabelMap: Record<ChatContextScope, string> = {
    organization: t('input.scope.organization'),
    project: t('input.scope.project'),
    my_docs: t('input.scope.myDocs'),
    folder: t('input.scope.folder'),
    document: t('input.scope.document'),
    custom_docs: t('input.scope.customDocs'),
  };

  const toolsetMeta = toolsetLabels[currentSearchConfig.toolset];
  const internalSummary =
    currentSearchConfig.toolset !== 'none'
      ? toolsetMeta.label
      : scopeLabelMap[currentSearchConfig.scope];

  const availableScopeOptions = useMemo(() => {
    if (draftConfig.scope === 'project') return projectOptions;
    if (draftConfig.scope === 'folder') return folderOptions;
    if (draftConfig.scope === 'document') return documentOptions;
    return [];
  }, [documentOptions, draftConfig.scope, folderOptions, projectOptions]);

  const isScopeRequired = SCOPE_REQUIRES_ID.includes(draftConfig.scope);
  const isScopeIdMissing =
    dialogCategory === 'rag' &&
    isScopeRequired &&
    !draftConfig.scopeId &&
    draftConfig.scope !== 'custom_docs';
  const isCustomDocsEmpty =
    dialogCategory === 'rag' &&
    draftConfig.scope === 'custom_docs' &&
    draftConfig.documentIds.length === 0;
  const disableInternalApply = isScopeIdMissing || isCustomDocsEmpty;

  return (
    <div className="bg-background/95 supports-backdrop-filter:bg-background/80 shrink-0 border-t backdrop-blur-sm">
      <div className="flex w-full min-w-0 flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'flex w-full min-w-0 items-end gap-2 rounded-2xl border p-2 shadow-sm transition-shadow',
            'focus-within:ring-ring focus-within:ring-2',
          )}
        >
          <Textarea
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            placeholder={t('input.placeholder')}
            disabled={disabled}
            rows={2}
            className="max-h-55 min-h-13 w-full min-w-0 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm focus-visible:ring-0 sm:min-h-14 sm:text-[15px] sm:leading-relaxed"
          />
          {isStreaming ? (
            <Button
              size="icon"
              variant="outline"
              onClick={onAbort}
              className="mb-0.5 h-10 w-10 shrink-0 sm:h-11 sm:w-11"
              title={t('input.stopGeneration')}
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={disabled}
              className="mb-0.5 h-10 w-10 shrink-0 sm:h-11 sm:w-11"
              title={t('input.send')}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Popover
              open={isCapabilityPopoverOpen}
              onOpenChange={(open) => {
                setIsCapabilityPopoverOpen(open);
                if (open) {
                  setCapabilityDraft({
                    internalEnabled: currentSearchConfig.internalEnabled,
                    externalEnabled: currentSearchConfig.externalEnabled,
                    externalMode: currentSearchConfig.externalMode,
                  });
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  title={t('input.changeMode')}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">{t('input.searchMode')}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    {t('input.capabilityPopover.title')}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    {t('input.capabilityPopover.description')}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="hover:bg-muted flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                    <Checkbox
                      checked={capabilityDraft.internalEnabled}
                      onCheckedChange={(checked) =>
                        setCapabilityDraft((prev) => ({
                          ...prev,
                          internalEnabled: checked === true,
                        }))
                      }
                    />
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {t('input.capabilityPopover.internalTool')}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t('input.capabilityPopover.internalDescription')}
                      </p>
                    </div>
                  </label>

                  <label className="hover:bg-muted flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                    <Checkbox
                      checked={capabilityDraft.externalEnabled}
                      onCheckedChange={(checked) =>
                        setCapabilityDraft((prev) => ({
                          ...prev,
                          externalEnabled: checked === true,
                        }))
                      }
                    />
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {t('input.capabilityPopover.externalTool')}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t('input.capabilityPopover.externalDescription')}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCapabilityPopoverOpen(false)}
                  >
                    {t('input.configDialog.cancel')}
                  </Button>
                  <Button type="button" size="sm" onClick={applyCapabilitySelection}>
                    {t('input.configDialog.apply')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {currentSearchConfig.internalEnabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/30 hover:bg-primary/15 rounded-full"
                onClick={() => handleInternalDialogOpenChange(true)}
              >
                {currentSearchConfig.toolset !== 'none' ? (
                  <Layers className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Library className="mr-1.5 h-3.5 w-3.5" />
                )}
                {t('input.capabilityPopover.internalTool')}
                <span className="text-primary/70 ml-1 hidden text-xs sm:inline">
                  {internalSummary}
                </span>
              </Button>
            ) : null}

            {currentSearchConfig.externalEnabled ? (
              <>
                <Popover
                  open={isExternalPopoverOpen}
                  onOpenChange={setIsExternalPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-primary/10 border-primary/30 hover:bg-primary/15 rounded-full"
                    >
                      <Globe className="mr-1.5 h-3.5 w-3.5" />
                      {t('input.capabilityPopover.externalTool')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">
                        {t('input.externalConfig.title')}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        {t('input.externalConfig.description')}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>

                <Select
                  value={currentSearchConfig.externalEnabled ? currentSearchConfig.externalMode : 'off'}
                  onValueChange={handleExternalModeChange}
                >
                  <SelectTrigger className="h-9 w-[150px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web_search">
                      {t('input.externalConfig.webSearch')}
                    </SelectItem>
                    <SelectItem value="off">
                      {t('input.externalConfig.off')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : null}

            {quota ? <QuotaBadge quota={quota} /> : null}
          </div>

          <p className="text-muted-foreground text-[11px] leading-snug sm:text-xs">
            {t('input.warning')}
          </p>
        </div>
      </div>

      <Dialog open={isInternalDialogOpen} onOpenChange={handleInternalDialogOpenChange}>
        <DialogContent className="flex h-[96vh] w-[98vw] max-w-[98vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[98vw]">
          <DialogHeader className="border-b px-4 py-4 sm:px-6">
            <DialogTitle>{t('input.internalDialog.title')}</DialogTitle>
            <DialogDescription>{t('input.internalDialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setDialogCategory('rag');
                  setDraftConfig((prev) => ({ ...prev, toolset: 'none' }));
                  void loadScopeOptions();
                }}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors',
                  dialogCategory === 'rag'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Library className="h-4 w-4 shrink-0" />
                  {t('modes.rag.label')}
                </div>
                <p className="text-muted-foreground text-xs">{t('modes.rag.description')}</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDialogCategory('toolset');
                  setDraftConfig((prev) => ({
                    ...prev,
                    toolset: prev.toolset === 'none' ? 'auto' : prev.toolset,
                  }));
                }}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors',
                  dialogCategory === 'toolset'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="h-4 w-4 shrink-0" />
                  {t('input.configDialog.toolsetCategoryLabel')}
                </div>
                <p className="text-muted-foreground text-xs">
                  {t('input.configDialog.toolsetCategoryDesc')}
                </p>
              </button>
            </div>

            {dialogCategory === 'toolset' ? (
              <div className="space-y-2 rounded-xl border p-3 sm:p-4">
                <Label>{t('input.configDialog.toolsetLabel')}</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {INTERNAL_TOOLSET_OPTIONS.map((key) => {
                    const meta = toolsetLabels[key];
                    const active = draftConfig.toolset === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            toolset: key,
                          }))
                        }
                        className={cn(
                          'rounded-xl border p-3 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted',
                        )}
                      >
                        <div className="text-sm font-medium">{meta.label}</div>
                        <p className="text-muted-foreground mt-1 text-xs">{meta.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 rounded-xl border p-3 sm:p-4">
                  <Label>{t('input.configDialog.scopeLabel')}</Label>
                  <Select
                    value={draftConfig.scope}
                    onValueChange={(value) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        scope: value as ChatContextScope,
                        scopeId: '',
                        documentIds: [],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organization">
                        {scopeLabelMap.organization}
                      </SelectItem>
                      <SelectItem value="project">{scopeLabelMap.project}</SelectItem>
                      <SelectItem value="my_docs">{scopeLabelMap.my_docs}</SelectItem>
                      <SelectItem value="folder">{scopeLabelMap.folder}</SelectItem>
                      <SelectItem value="document">{scopeLabelMap.document}</SelectItem>
                      <SelectItem value="custom_docs">
                        {scopeLabelMap.custom_docs}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isScopeRequired ? (
                  <div className="space-y-2 rounded-xl border p-3 sm:p-4">
                    <Label>{t('input.configDialog.scopeSelectLabel')}</Label>
                    <SearchableSelect
                      options={availableScopeOptions}
                      value={draftConfig.scopeId}
                      onChange={(value) =>
                        setDraftConfig((prev) => ({ ...prev, scopeId: value }))
                      }
                      placeholder={
                        isScopeOptionsLoading
                          ? t('input.configDialog.loadingOptions')
                          : draftConfig.scope === 'project'
                            ? t('input.configDialog.projectSearchPlaceholder')
                            : draftConfig.scope === 'folder'
                              ? t('input.configDialog.folderSearchPlaceholder')
                              : t('input.configDialog.documentSearchPlaceholder')
                      }
                      emptyMessage={scopeOptionsError ?? t('input.configDialog.noOptions')}
                      disabled={isScopeOptionsLoading}
                    />

                    {isScopeIdMissing ? (
                      <p className="text-destructive text-xs">
                        {t('input.configDialog.scopeIdRequired')}
                      </p>
                    ) : null}

                    <p className="text-muted-foreground text-xs">
                      {t('input.configDialog.scopeRequiredHint')}
                    </p>
                  </div>
                ) : null}

                {draftConfig.scope === 'custom_docs' ? (
                  <div className="space-y-2 rounded-xl border p-3 sm:p-4">
                    <Label>{t('input.configDialog.multiDocumentLabel')}</Label>
                    <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border p-2">
                      {documentOptions.map((option) => {
                        const checked = draftConfig.documentIds.includes(option.id);
                        return (
                          <label
                            key={option.id}
                            className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(checkedValue) =>
                                setDraftConfig((prev) => ({
                                  ...prev,
                                  documentIds:
                                    checkedValue === true
                                      ? Array.from(new Set([...prev.documentIds, option.id]))
                                      : prev.documentIds.filter((id) => id !== option.id),
                                }))
                              }
                            />
                            <span className="truncate">{option.label}</span>
                          </label>
                        );
                      })}
                      {!documentOptions.length ? (
                        <p className="text-muted-foreground text-xs">
                          {isScopeOptionsLoading
                            ? t('input.configDialog.loadingOptions')
                            : t('input.configDialog.noOptions')}
                        </p>
                      ) : null}
                    </div>
                    {isCustomDocsEmpty ? (
                      <p className="text-destructive text-xs">
                        {t('input.configDialog.scopeIdRequired')}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2 sm:p-4">
                  {draftConfig.scope === 'folder' ? (
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={draftConfig.includeSubfolders}
                        onCheckedChange={(checked) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            includeSubfolders: checked === true,
                          }))
                        }
                      />
                      {t('input.configDialog.includeSubfolders')}
                    </label>
                  ) : null}

                  {draftConfig.scope === 'my_docs' ? (
                    <>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={draftConfig.preferOwner}
                          onCheckedChange={(checked) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              preferOwner: checked === true,
                            }))
                          }
                        />
                        {t('input.configDialog.preferOwner')}
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={draftConfig.includeSharedDocs}
                          onCheckedChange={(checked) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              includeSharedDocs: checked === true,
                            }))
                          }
                        />
                        {t('input.configDialog.includeSharedDocs')}
                      </label>

                      <div className="space-y-2">
                        <Label>{t('input.configDialog.timeRange')}</Label>
                        <Select
                          value={draftConfig.timeRange}
                          onValueChange={(value) =>
                            setDraftConfig((prev) => ({
                              ...prev,
                              timeRange: value as ChatSearchConfigState['timeRange'],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7d">
                              {t('input.configDialog.timeRange7d')}
                            </SelectItem>
                            <SelectItem value="30d">
                              {t('input.configDialog.timeRange30d')}
                            </SelectItem>
                            <SelectItem value="all">
                              {t('input.configDialog.timeRangeAll')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : null}

                  <div className="space-y-2">
                    <Label>{t('input.configDialog.category')}</Label>
                    <SearchableSelect
                      options={categoryOptions}
                      value={draftConfig.category}
                      onChange={(value) =>
                        setDraftConfig((prev) => ({ ...prev, category: value }))
                      }
                      placeholder={
                        isScopeOptionsLoading
                          ? t('input.configDialog.loadingOptions')
                          : t('input.configDialog.categorySelectPlaceholder')
                      }
                      emptyMessage={
                        isScopeOptionsLoading
                          ? t('input.configDialog.loadingOptions')
                          : t('input.configDialog.noCategories')
                      }
                      disabled={isScopeOptionsLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('input.configDialog.fileType')}</Label>
                    <SearchableSelect
                      options={fileTypeOptions}
                      value={draftConfig.fileType}
                      onChange={(value) =>
                        setDraftConfig((prev) => ({ ...prev, fileType: value }))
                      }
                      placeholder={
                        isScopeOptionsLoading
                          ? t('input.configDialog.loadingOptions')
                          : t('input.configDialog.fileTypeSelectPlaceholder')
                      }
                      emptyMessage={
                        isScopeOptionsLoading
                          ? t('input.configDialog.loadingOptions')
                          : t('input.configDialog.noFileTypes')
                      }
                      disabled={isScopeOptionsLoading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={draftConfig.strictScope}
                        onCheckedChange={(checked) =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            strictScope: checked === true,
                          }))
                        }
                      />
                      {t('input.configDialog.strictScope')}
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t px-4 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInternalDialogOpen(false)}
            >
              {t('input.configDialog.cancel')}
            </Button>
            <Button type="button" onClick={applyInternalConfig} disabled={disableInternalApply}>
              {t('input.configDialog.apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
