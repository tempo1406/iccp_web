"use client";
import { TeamChatScreen } from '@/features/tenant/team-chat/components/team-chat-screen';

export default function TeamChatPage() {
  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      <TeamChatScreen />
    </div>
  );
}
