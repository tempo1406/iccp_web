'use client';

import { useEffect } from 'react';
import { useTeamChatScreenController } from '../hooks/use-team-chat-screen-controller';
import { clearTeamChatSearchContext, setTeamChatSearchContext } from '../store';
import { TeamChatScreenView } from './team-chat-screen-view';

export function TeamChatScreen() {
  const props = useTeamChatScreenController();

  useEffect(() => {
    setTeamChatSearchContext({
      activeRoomId: props.activeView === 'channel' ? props.activeConversationRoom.id : '',
      activeRoomName: props.activeView === 'channel' ? props.activeConversationDisplay.title : '',
      activeConversationKind:
        props.activeView === 'channel' ? props.activeConversationKind : null,
      scope: props.roomScopeFilter.scope,
      projectId: props.roomScopeFilter.projectId,
    });

    return () => {
      clearTeamChatSearchContext();
    };
  }, [
    props.activeConversationDisplay.title,
    props.activeConversationKind,
    props.activeConversationRoom.id,
    props.activeView,
    props.roomScopeFilter.projectId,
    props.roomScopeFilter.scope,
  ]);

  return <TeamChatScreenView {...props} />;
}
