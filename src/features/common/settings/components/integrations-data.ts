export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  category: 'storage' | 'communication' | 'crm' | 'productivity';
  lastSync?: string;
}

export const integrations: Integration[] = [
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Sync documents and folders from your Google Drive.',
    icon: '/icons/gdrive.png',
    status: 'connected',
    category: 'storage',
    lastSync: '2 mins ago',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive notifications and interact with the bot via Slack.',
    icon: '/icons/slack.png',
    status: 'connected',
    category: 'communication',
    lastSync: '1 hour ago',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect customer data and sales records.',
    icon: '/icons/salesforce.png',
    status: 'disconnected',
    category: 'crm',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Index knowledge base pages from Notion.',
    icon: '/icons/notion.png',
    status: 'disconnected',
    category: 'productivity',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'Enterprise document management sync.',
    icon: '/icons/sharepoint.png',
    status: 'error',
    category: 'storage',
    lastSync: 'Failed 2 hours ago',
  },
];
