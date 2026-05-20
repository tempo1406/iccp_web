'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeMutation, useSafeQuery } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ImageKitService } from '@/services/imagekit/imagekit.service';
import { LandingPageService } from '../services/landing-page.service';
import type {
  CreateTemplateBody,
  UpdateTemplateBody,
  UpsertLandingPageBody,
  UpsertLandingPageDraftBody,
} from '../types/landing-page.types';
import type { MediaAsset } from '../utils/media-library.storage';

const landingPageKeys = {
  bySlug: (slug: string | null | undefined) => ['landing-page', slug] as const,
  draft: (orgId: string | null | undefined) => ['landing-page', 'draft', orgId] as const,
};

const templateKeys = {
  list: (orgId: string | null | undefined) =>
    ['landing-page-templates', orgId] as const,
  detail: (orgId: string | null | undefined, templateId: string) =>
    ['landing-page-templates', orgId, templateId] as const,
};

const mediaKeys = {
  list: (orgSlug: string | null | undefined) =>
    ['landing-page-media', orgSlug] as const,
};

export function useLandingPageQuery(slug: string | null | undefined) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: landingPageKeys.bySlug(slug),
      queryFn: () => new LandingPageService(ctx).getLandingPage(slug!),
      enabled: Boolean(slug),
      staleTime: 5 * 60 * 1000,
    }),
  );
}

export function useUpsertLandingPageMutation(slug: string | null | undefined) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpsertLandingPageBody) => {
        const orgId = ctx.tenantId!;
        return new LandingPageService(ctx).upsertLandingPage(orgId, body);
      },
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: landingPageKeys.bySlug(slug) });
      },
    }),
  );
}

export function useLandingPageDraftQuery(orgId: string | null | undefined) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: landingPageKeys.draft(orgId),
      queryFn: () => new LandingPageService(ctx).getLandingPageDraft(orgId!),
      enabled: Boolean(orgId),
      staleTime: 30 * 1000,
    }),
  );
}

export function useUpsertLandingPageDraftMutation(orgId: string | null | undefined) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpsertLandingPageDraftBody) =>
        new LandingPageService(ctx).upsertLandingPageDraft(orgId!, body),
      onSuccess: (data) => {
        qc.setQueryData(landingPageKeys.draft(orgId), data);
      },
    }),
  );
}

export function useTemplatesQuery(orgId: string | null | undefined) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: templateKeys.list(orgId),
      queryFn: () => new LandingPageService(ctx).listTemplates(orgId!),
      enabled: Boolean(orgId),
      staleTime: 5 * 60 * 1000,
    }),
  );
}

export function useCreateTemplateMutation(orgId: string | null | undefined) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateTemplateBody) =>
        new LandingPageService(ctx).createTemplate(orgId!, body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: templateKeys.list(orgId) });
      },
    }),
  );
}

export function useUpdateTemplateMutation(
  orgId: string | null | undefined,
  templateId: string,
) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: UpdateTemplateBody) =>
        new LandingPageService(ctx).updateTemplate(orgId!, templateId, body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: templateKeys.list(orgId) });
      },
    }),
  );
}

export function useMediaAssetsQuery(orgSlug: string | null | undefined) {
  const ctx = useServiceContext();
  return useQuery({
    queryKey: mediaKeys.list(orgSlug),
    queryFn: async (): Promise<MediaAsset[]> => {
      const svc = new ImageKitService(ctx);
      const files = await svc.listFiles(`organizations/landing-pages/${orgSlug}`);
      return files.map((f) => ({
        url: f.url,
        fileId: f.fileId,
        name: f.name,
        kind: f.fileType === 'image' ? ('image' as const) : ('video' as const),
      }));
    },
    enabled: Boolean(orgSlug),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDeleteTemplateMutation(orgId: string | null | undefined) {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (templateId: string) =>
        new LandingPageService(ctx).deleteTemplate(orgId!, templateId),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: templateKeys.list(orgId) });
      },
    }),
  );
}
