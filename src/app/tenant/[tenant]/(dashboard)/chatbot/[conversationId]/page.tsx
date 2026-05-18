'use client';

import { Suspense, use, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/providers/tenant-context';
import { ROUTES } from '@/common/constant/routes';
import { ChatbotPage } from '@/features/common/chatbot/pages/chatbot-page';
import { usePersistedChatMode } from '@/features/common/chatbot/hooks/use-persisted-chat-mode';
import { usePersistedChatModel } from '@/features/common/chatbot/hooks/use-persisted-chat-model';
import { usePersistedChatToolset } from '@/features/common/chatbot/hooks/use-persisted-chat-toolset';

function ChatbotConversationContent({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId } = useTenant();
  const { mode, setMode } = usePersistedChatMode();
  const { toolset, setToolset } = usePersistedChatToolset();
  const { selectedModelId, setSelectedModelId } = usePersistedChatModel();

  const handleNavigate = useCallback(
    (id: string | null) => {
      const q = searchParams.toString();
      const path =
        id == null
          ? ROUTES.tenant.chatbot(tenantId ?? '')
          : ROUTES.tenant.chatbotConversation(tenantId ?? '', id);
      router.replace(q ? `${path}?${q}` : path);
    },
    [router, tenantId, searchParams],
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <ChatbotPage
        conversationId={conversationId}
        onNavigate={handleNavigate}
        mode={mode}
        onModeChange={setMode}
        toolset={toolset}
        onToolsetChange={setToolset}
        selectedModelId={selectedModelId}
        onSelectedModelIdChange={setSelectedModelId}
      />
    </div>
  );
}

export default function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border">
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        }
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ChatbotConversationContent conversationId={conversationId} />
        </div>
      </Suspense>
    </div>
  );
}
