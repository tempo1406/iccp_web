import { PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { type ChannelDetailTabItem } from '../data/team-chat-channel-details';
import { TabManageRow } from './team-chat-conversation-details-shared';

interface TeamChatConversationTabsPanelProps {
  canManageTabs: boolean;
  hiddenDetailTabs: ChannelDetailTabItem[];
  onCreateTabPlaceholder: () => void;
  onMoveTab: (tabId: string, direction: 'up' | 'down') => void;
  onToggleTabVisibility: (tabId: string) => void;
  visibleDetailTabs: ChannelDetailTabItem[];
}

export function TeamChatConversationTabsPanel({
  canManageTabs,
  hiddenDetailTabs,
  onCreateTabPlaceholder,
  onMoveTab,
  onToggleTabVisibility,
  visibleDetailTabs,
}: TeamChatConversationTabsPanelProps) {
  const t = useTranslations('teamChat');

  return (
    <TabsContent value="tabs" className="min-h-0 flex-1 overflow-hidden">
      <ScrollArea className="h-full min-h-0">
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-3xl border border-border bg-background/70 px-5 py-5 shadow-sm">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {t('tabsPanel.title')}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              {t('tabsPanel.description')}
            </p>
            {!canManageTabs ? (
              <p className="mt-2 text-xs font-medium text-amber-400">
                {t('tabsPanel.ownerOnly')}
              </p>
            ) : null}

            <div className="mt-6 space-y-2.5">
              {visibleDetailTabs.map((tab, index) => (
                <TabManageRow
                  key={tab.id}
                  tab={tab}
                  canManageTabs={canManageTabs}
                  canMoveUp={index > 0}
                  canMoveDown={index < visibleDetailTabs.length - 1}
                  onMove={onMoveTab}
                  onToggleVisibility={onToggleTabVisibility}
                />
              ))}

              {hiddenDetailTabs.map((tab, index) => (
                <TabManageRow
                  key={tab.id}
                  tab={tab}
                  hidden
                  canManageTabs={canManageTabs}
                  canMoveUp={index > 0}
                  canMoveDown={index < hiddenDetailTabs.length - 1}
                  onMove={onMoveTab}
                  onToggleVisibility={onToggleTabVisibility}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-5 cursor-pointer rounded-2xl"
              disabled={!canManageTabs}
              onClick={onCreateTabPlaceholder}
            >
              <PlusCircle className="h-4 w-4" />
              {t('tabsPanel.newTab')}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </TabsContent>
  );
}
