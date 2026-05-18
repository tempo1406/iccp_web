'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { isErr, isOk } from '@/lib/safe-query';
import { toast } from '@/lib/toast';
import { useTenant } from '@/providers';
import {
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useLandingPageQuery,
  useTemplatesQuery,
  useUpsertLandingPageMutation,
} from '../query/use-landing-page';
import {
  LANDING_PAGE_TEMPLATE_ID_META_KEY,
  type LandingPageTemplateDto,
} from '../types/landing-page.types';
import { STARTER_TEMPLATES } from '../utils/starter-templates';

const INITIAL_LIBRARY_ITEMS = 7;
const LIBRARY_ITEMS_PER_LOAD = 8;

function getPublicUrl(orgSlug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/org/${orgSlug}/landing-page`;
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function normalizeTemplateMatchValue(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function extractTemplateIdFromProjectData(projectData?: string | null): string | null {
  const normalizedProjectData = normalizeTemplateMatchValue(projectData);
  if (!normalizedProjectData) return null;

  try {
    const parsed = JSON.parse(normalizedProjectData) as Record<string, unknown>;
    const templateId = parsed[LANDING_PAGE_TEMPLATE_ID_META_KEY];
    return typeof templateId === 'string' && templateId.trim().length > 0 ? templateId : null;
  } catch {
    return null;
  }
}

function resolveActiveTemplate(
  templates: LandingPageTemplateDto[],
  activePage: { rawHtml?: string; projectData?: string } | null | undefined,
): LandingPageTemplateDto | undefined {
  const activeTemplateId = extractTemplateIdFromProjectData(activePage?.projectData);
  if (activeTemplateId) {
    const templateIdMatch = templates.find((template) => template.id === activeTemplateId);
    if (templateIdMatch) {
      return templateIdMatch;
    }
  }

  const activeProjectData = normalizeTemplateMatchValue(activePage?.projectData);
  if (activeProjectData) {
    const projectDataMatch = templates.find(
      (template) => normalizeTemplateMatchValue(template.projectData) === activeProjectData,
    );
    if (projectDataMatch) {
      return projectDataMatch;
    }
  }

  const activeHtml = normalizeTemplateMatchValue(activePage?.rawHtml);
  if (activeHtml) {
    return templates.find(
      (template) => normalizeTemplateMatchValue(template.html) === activeHtml,
    );
  }

  return undefined;
}

function PageCard({
  name,
  html,
  updatedAt,
  isActive,
  onView,
  onEdit,
  onSetActive,
  onDelete,
}: {
  name: string;
  html?: string;
  updatedAt: string;
  isActive: boolean;
  onView?: () => void;
  onEdit: () => void;
  onSetActive?: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('siteStudio.builder');
  const locale = useLocale();

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg ${
        isActive
          ? 'border-primary/60 ring-primary/15 shadow-md ring-2'
          : 'border-border/70 hover:border-border hover:shadow-md'
      }`}
    >
      <div
        className="relative cursor-pointer overflow-hidden"
        style={{ height: 180, background: '#f4f5f7' }}
        onClick={onEdit}
      >
        {html?.trim() ? (
          <iframe
            title={name}
            srcDoc={html}
            sandbox="allow-same-origin allow-scripts"
            className="pointer-events-none block border-0"
            style={{
              width: '1280px',
              height: '900px',
              transform: 'scale(0.205)',
              transformOrigin: 'top left',
            }}
          />
        ) : (
          <div className="text-muted-foreground/40 flex h-full flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8" />
            <span className="text-xs">{t('emptyPage')}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/8" />

        {isActive && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {t('active')}
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/70 bg-white/95 text-gray-600 shadow-sm backdrop-blur-sm hover:text-gray-900"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {onView && (
                <DropdownMenuItem onClick={onView} className="gap-2 text-sm">
                  <Eye className="h-3.5 w-3.5" />
                  {t('viewLive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit} className="gap-2 text-sm">
                <Pencil className="h-3.5 w-3.5" />
                {t('actions.edit')}
              </DropdownMenuItem>
              {onSetActive && !isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSetActive} className="gap-2 text-sm">
                    <Upload className="h-3.5 w-3.5" />
                    {t('actions.setAsActive')}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive gap-2 text-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-border/40 flex items-center justify-between gap-2 border-t bg-white px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm leading-tight font-semibold">
            {name}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {formatDate(updatedAt, locale)}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="text-primary hover:bg-primary/8 hover:text-primary/80 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
        >
          {t('actions.edit')}
        </button>
      </div>
    </div>
  );
}

function StarterCard({
  name,
  description,
  html,
  onUse,
  loading,
}: {
  name: string;
  description: string;
  html: string;
  onUse: () => void;
  loading: boolean;
}) {
  const t = useTranslations('siteStudio.builder');

  return (
    <div className="group border-border/70 hover:border-primary/30 relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg">
      <div
        className="relative cursor-pointer overflow-hidden"
        style={{ height: 180, background: '#f4f5f7' }}
        onClick={onUse}
      >
        <iframe
          title={name}
          srcDoc={html}
          sandbox="allow-same-origin allow-scripts"
          className="pointer-events-none block border-0"
          style={{
            width: '1280px',
            height: '900px',
            transform: 'scale(0.205)',
            transformOrigin: 'top left',
          }}
        />

        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/8" />

        <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(event) => {
              event.stopPropagation();
              onUse();
            }}
            disabled={loading}
            className="hover:text-primary flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition-colors disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
            {t('actions.useTemplate')}
          </button>
        </div>
      </div>

      <div className="border-border/40 flex items-center justify-between gap-2 border-t bg-white px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm leading-tight font-semibold">
            {name}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
            {description}
          </p>
        </div>
        <button
          onClick={onUse}
          disabled={loading}
          className="text-primary hover:bg-primary/8 hover:text-primary/80 shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : t('actions.useTemplate')}
        </button>
      </div>
    </div>
  );
}

function SiteStudioPageSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-5">
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`library-skeleton-${index}`}
                  className="border-border/70 overflow-hidden rounded-2xl border bg-white"
                >
                  <Skeleton className="h-[180px] w-full rounded-none" />
                  <div className="border-border/40 space-y-2 border-t px-3.5 py-2.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`starter-skeleton-${index}`}
                  className="border-border/70 overflow-hidden rounded-2xl border bg-white"
                >
                  <Skeleton className="h-[180px] w-full rounded-none" />
                  <div className="border-border/40 space-y-2 border-t px-3.5 py-2.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type LibraryCardItem = {
  id: string;
  name: string;
  html?: string;
  updatedAt: string;
  isActive: boolean;
  onView?: () => void;
  onEdit: () => void;
  onSetActive?: () => void;
  onDelete: () => void;
};

export function LandingPageBuilderPage() {
  const t = useTranslations('siteStudio.builder');
  const canEdit = useCan(PERMISSIONS.TENANT_ORGANIZATIONS_MANAGE_LANDING_PAGE);
  const { tenantSlug, tenantId } = useTenant();
  const router = useRouter();

  const landingPageQuery = useLandingPageQuery(tenantSlug);
  const templatesQuery = useTemplatesQuery(tenantId);
  const upsertMutation = useUpsertLandingPageMutation(tenantSlug);
  const deleteMutation = useDeleteTemplateMutation(tenantId);
  const createMutation = useCreateTemplateMutation(tenantId);

  const [urlOpen, setUrlOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usingTpl, setUsingTpl] = useState<string | null>(null);
  const [visibleLibraryItems, setVisibleLibraryItems] = useState(INITIAL_LIBRARY_ITEMS);

  const publicUrl = getPublicUrl(tenantSlug ?? '');
  const getStarterTemplateCopy = (starterId: (typeof STARTER_TEMPLATES)[number]['id']) => ({
    name: t(`starterTemplatesList.${starterId}.name`),
    description: t(`starterTemplatesList.${starterId}.description`),
  });

  const handleCopyUrl = () => {
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNewPage = () => {
    router.push(`/tenant/${tenantSlug}/organization-management/landing-page-editor`);
  };

  const handleEditTemplate = (templateId: string) => {
    router.push(
      `/tenant/${tenantSlug}/organization-management/landing-page-editor?templateId=${templateId}`,
    );
  };

  const handlePublishTemplate = async (template: LandingPageTemplateDto) => {
    const result = await upsertMutation.mutateAsync({
      rawHtml: template.html,
      projectData: template.projectData,
      isPublished: true,
    });

    if (isOk(result)) {
      toast.success(t('toasts.activeSetSuccess', { name: template.name }));
    } else if (isErr(result)) {
      toast.danger(result.error.message ?? t('toasts.publishFailed'));
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const result = await deleteMutation.mutateAsync(templateId);
    if (isOk(result)) {
      toast.success(t('toasts.pageDeleted'));
    } else if (isErr(result)) {
      toast.danger(t('toasts.deleteFailed'));
    }
  };

  const handleUseStarter = async (starter: (typeof STARTER_TEMPLATES)[number]) => {
    const starterCopy = getStarterTemplateCopy(starter.id);
    setUsingTpl(starter.id);
    const result = await createMutation.mutateAsync({
      name: starterCopy.name,
      html: starter.html,
    });
    setUsingTpl(null);

    if (isOk(result)) {
      toast.success(t('toasts.templateAdded', { name: starterCopy.name }));
      const newId = (result.data as { id?: string }).id;
      if (newId) {
        handleEditTemplate(newId);
      }
    } else {
      toast.danger(t('toasts.createFromTemplateFailed'));
    }
  };

  if (!canEdit) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        {t('permissionDenied')}
      </div>
    );
  }

  if (landingPageQuery.isPending || templatesQuery.isPending) {
    return <SiteStudioPageSkeleton />;
  }

  const activePage = landingPageQuery.data;
  const hasActive = Boolean(activePage?.rawHtml?.trim());
  const templates = templatesQuery.data ?? [];
  const activeTemplate = hasActive ? resolveActiveTemplate(templates, activePage) : undefined;
  const activeTemplateId = activeTemplate?.id;

  const libraryCards: LibraryCardItem[] = [];

  if (hasActive) {
    libraryCards.push({
      id: activeTemplateId ?? '__active_page__',
      name: activeTemplateId
        ? (activeTemplate?.name ?? t('activePage'))
        : t('activePage'),
      html: activePage?.rawHtml ?? '',
      updatedAt: activePage?.updatedAt ?? '',
      isActive: true,
      onView: () => window.open(publicUrl, '_blank'),
      onEdit: () => {
        if (activeTemplateId) {
          handleEditTemplate(activeTemplateId);
          return;
        }

        router.push(
          `/tenant/${tenantSlug}/organization-management/landing-page-editor?fromActive=true`,
        );
      },
      onDelete: () => {
        void upsertMutation.mutateAsync({
          rawHtml: '',
          isPublished: false,
        });
        toast.success(t('toasts.activeRemoved'));
      },
    });
  }

  for (const template of templates) {
    if (template.id === activeTemplateId) {
      continue;
    }

    libraryCards.push({
      id: template.id,
      name: template.name,
      html: template.html,
      updatedAt: template.updatedAt,
      isActive: false,
      onEdit: () => handleEditTemplate(template.id),
      onSetActive: () => void handlePublishTemplate(template),
      onDelete: () => void handleDeleteTemplate(template.id),
    });
  }

  const visibleCards = libraryCards.slice(0, visibleLibraryItems);
  const hasMoreLibraryCards = libraryCards.length > visibleLibraryItems;

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-base font-semibold">{t('title')}</h1>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {t('description')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasActive && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setUrlOpen(true)}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {t('publicUrl')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => window.open(publicUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('viewLive')}
                  </Button>
                </>
              )}
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleNewPage}>
                <Plus className="h-3.5 w-3.5" />
                {t('newPage')}
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 pb-5">
          <div className="space-y-8">
            {(hasActive || templates.length > 0) && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  {hasActive && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                  )}
                  <h2 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                    {t('pageLibrary')}
                  </h2>
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    {templates.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <button
                    onClick={handleNewPage}
                    className="border-border/50 bg-background/60 text-muted-foreground hover:border-primary/40 hover:bg-primary/4 hover:text-primary flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed transition-all"
                    style={{ minHeight: 240 }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current opacity-60">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold">{t('newPage')}</span>
                  </button>

                  {visibleCards.map((card) => (
                    <PageCard
                      key={card.id}
                      name={card.name}
                      html={card.html}
                      updatedAt={card.updatedAt}
                      isActive={card.isActive}
                      onView={card.onView}
                      onEdit={card.onEdit}
                      onSetActive={card.onSetActive}
                      onDelete={card.onDelete}
                    />
                  ))}
                </div>

                {hasMoreLibraryCards && (
                  <div className="mt-5 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setVisibleLibraryItems(
                          (current) => current + LIBRARY_ITEMS_PER_LOAD,
                        )
                      }
                    >
                      {t('loadMore')}
                    </Button>
                  </div>
                )}
              </section>
            )}

            <section>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="text-primary h-3.5 w-3.5" />
                  <h2 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                    {t('starterTemplates')}
                  </h2>
                  <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                    {STARTER_TEMPLATES.length}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t('pickTemplate')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {STARTER_TEMPLATES.map((starter) => {
                  const starterCopy = getStarterTemplateCopy(starter.id);

                  return (
                  <StarterCard
                    key={starter.id}
                    name={starterCopy.name}
                    description={starterCopy.description}
                    html={starter.html}
                    loading={usingTpl === starter.id}
                    onUse={() => void handleUseStarter(starter)}
                  />
                  );
                })}
              </div>
            </section>

            {templates.length === 0 && !hasActive && (
              <div className="border-border/40 bg-background/60 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-12 text-center">
                <div className="border-primary/15 bg-primary/8 flex h-14 w-14 items-center justify-center rounded-2xl border">
                  <Globe className="text-primary/50 h-7 w-7" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-foreground text-sm font-semibold">{t('startNowTitle')}</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    {t('startNowDescription')}
                  </p>
                </div>
                <Button onClick={handleNewPage} size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  {t('createBlankPage')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('publishedUrl')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              {t('publicUrlDescription')}
            </p>
            <div className="space-y-1.5">
              <Label>{t('publicUrl')}</Label>
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="font-mono text-xs" />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={handleCopyUrl}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? t('copied') : t('copy')}
                </Button>
              </div>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs underline"
            >
              {t('openInNewTab')}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
