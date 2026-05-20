'use client';
import { useCallback, useState } from 'react';
import { ChatbotSidebar } from '../components/chatbot-sidebar';
import { ChatbotHeader } from '../components/chatbot-header';
import { ChatbotMessageList } from '../components/chatbot-message-list';
import { ChatbotInputBar } from '../components/chatbot-input-bar';
import { ChatbotEmptyState } from '../components/chatbot-empty-state';
import { ChatbotSuggestions } from '../components/chatbot-suggestions';
import { useChatbotPage } from '../hooks/use-chatbot-page';
import type { ChatMode, ChatToolset } from '../types';

const SIDEBAR_KEY = 'iccp.chatbot.sidebar.open';

interface ChatbotPageProps {
  conversationId: string | null;
  onNavigate: (id: string | null) => void;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  toolset: ChatToolset;
  onToolsetChange: (toolset: ChatToolset) => void;
  selectedModelId: string | null;
  onSelectedModelIdChange: (modelId: string | null) => void;
}

export function ChatbotPage({
  conversationId,
  onNavigate,
  mode,
  onModeChange,
  toolset,
  onToolsetChange,
  selectedModelId,
  onSelectedModelIdChange,
}: ChatbotPageProps) {
  // Persist sidebar open/close in localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    return stored === null ? true : stored === 'true';
  });
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  }, []);

  const {
    conversations,
    activeConversation,
    handleSelectConversation,
    handleNewChat,
    handleDeleteConversation,
    messages,
    historyLoading,
    handleSend,
    handleConfirmPendingAction,
    handleCancelPendingAction,
    handleConversationConfigChange,
    busyPendingActionId,
    isStreaming,
    abort,
    quota,
    modelOptions,
    selectedModelId: effectiveSelectedModelId,
    setSelectedModelId,
    suggestions,
  } = useChatbotPage({
    conversationId,
    onNavigate,
    mode,
    toolset,
    preferredModelId: selectedModelId,
    onPreferredModelIdChange: onSelectedModelIdChange,
  });

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ChatbotSidebar
        conversations={conversations}
        activeId={conversationId}
        isOpen={sidebarOpen}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ChatbotHeader
          conversationTitle={activeConversation?.title}
          modelOptions={modelOptions}
          selectedModelId={effectiveSelectedModelId}
          onModelChange={setSelectedModelId}
          isStreaming={isStreaming}
          disabled={historyLoading}
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {!historyLoading && messages.length === 0 ? (
          <ChatbotEmptyState
            mode={mode}
            onSuggestion={handleSend}
            onNewChat={handleNewChat}
          />
        ) : (
          <ChatbotMessageList
            messages={messages}
            isLoading={historyLoading}
            isStreaming={isStreaming}
            busyPendingActionId={busyPendingActionId}
            onConfirmPendingAction={handleConfirmPendingAction}
            onCancelPendingAction={handleCancelPendingAction}
          />
        )}

        {/* Suggestions panel — sits between message area and input bar */}
        {suggestions.length > 0 && (
          <div className="shrink-0 px-4 pb-2 sm:px-6 lg:px-8">
            <ChatbotSuggestions
              questions={suggestions}
              onSelect={handleSend}
              isStreaming={isStreaming}
            />
          </div>
        )}

        <ChatbotInputBar
          mode={mode}
          onModeChange={onModeChange}
          toolset={toolset}
          onToolsetChange={onToolsetChange}
          onConversationConfigChange={handleConversationConfigChange}
          onSend={handleSend}
          isStreaming={isStreaming}
          onAbort={abort}
          disabled={historyLoading}
          quota={quota}
        />
      </div>
    </div>
  );
}
