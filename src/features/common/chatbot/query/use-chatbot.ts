'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeQuery, useSafeMutation } from '@/lib/safe-query';
import { useServiceContext } from '@/lib/use-service-context';
import { ChatbotService } from '../services/chatbot.service';
import type { ConversationDto, CreateConversationBody } from '../types';

export const chatbotKeys = {
  all: ['chatbot'] as const,
  conversations: (tenantId: string | null | undefined) =>
    [...chatbotKeys.all, tenantId ?? 'no-tenant', 'conversations'] as const,
  conversation: (tenantId: string | null | undefined, id: string) =>
    [...chatbotKeys.all, tenantId ?? 'no-tenant', 'conversations', id] as const,
  messages: (tenantId: string | null | undefined, id: string) =>
    [...chatbotKeys.all, tenantId ?? 'no-tenant', 'messages', id] as const,
  quota: (tenantId: string | null | undefined) =>
    [...chatbotKeys.all, tenantId ?? 'no-tenant', 'quota'] as const,
  modelOptions: (tenantId: string | null | undefined) =>
    [...chatbotKeys.all, tenantId ?? 'no-tenant', 'model-options'] as const,
};

export function useConversations() {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: chatbotKeys.conversations(ctx.tenantId),
      queryFn: () => new ChatbotService(ctx).listConversations(),
      staleTime: 30_000,
    }),
  );
}

export function useConversationMessages(conversationId: string | null) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: chatbotKeys.messages(ctx.tenantId, conversationId ?? ''),
      queryFn: () => new ChatbotService(ctx).getAllMessages(conversationId!),
      enabled: Boolean(conversationId),
      staleTime: 0,
    }),
  );
}

export function useCreateConversation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (body: CreateConversationBody) =>
        new ChatbotService(ctx).createConversation(body),
      onSuccess: (newConv: ConversationDto) => {
        qc.setQueryData(
          chatbotKeys.conversations(ctx.tenantId),
          (prev: ConversationDto[] | undefined) => {
            const list = prev ?? [];
            if (list.some((c) => c.id === newConv.id)) return list;
            return [newConv, ...list];
          },
        );
        void qc.invalidateQueries({ queryKey: chatbotKeys.conversations(ctx.tenantId) });
      },
    }),
  );
}

export function useMyQuota(enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: chatbotKeys.quota(ctx.tenantId),
      queryFn: () => new ChatbotService(ctx).getMyQuota(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
      refetchInterval: 60_000,
      retry: false,
    }),
  );
}

export function useModelOptions(enabled = true) {
  const ctx = useServiceContext();
  return useSafeQuery(
    useQuery({
      queryKey: chatbotKeys.modelOptions(ctx.tenantId),
      queryFn: () => new ChatbotService(ctx).listModelOptions(),
      enabled: Boolean(ctx.tenantId) && enabled,
      staleTime: 60_000,
    }),
  );
}

export function useDeleteConversation() {
  const ctx = useServiceContext();
  const qc = useQueryClient();
  return useSafeMutation(
    useMutation({
      mutationFn: (id: string) => new ChatbotService(ctx).deleteConversation(id),
      onSuccess: () =>
        void qc.invalidateQueries({ queryKey: chatbotKeys.conversations(ctx.tenantId) }),
    }),
  );
}
