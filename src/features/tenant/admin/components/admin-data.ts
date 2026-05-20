import type { LucideIcon } from 'lucide-react';
import { ClipboardCheck, Puzzle, ScrollText, Workflow } from 'lucide-react';

export interface QuickAccessItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export interface ServiceHealthItem {
  name: string;
  status: 'Operational' | 'Degraded';
  uptime: string;
}

export const quickAccessItems: QuickAccessItem[] = [
  {
    href: '/admin/audit-logs',
    icon: ScrollText,
    label: 'Audit Logs',
    description: 'View system activity logs',
  },
  {
    href: '/documents/approval',
    icon: ClipboardCheck,
    label: 'Document Approval',
    description: 'Pending documents review',
  },
  {
    href: '/settings/workflow',
    icon: Workflow,
    label: 'Workflow Builder',
    description: 'Configure approval chains',
  },
  {
    href: '/settings/integrations',
    icon: Puzzle,
    label: 'Integrations',
    description: 'Connected apps & services',
  },
];

export const serviceHealthItems: ServiceHealthItem[] = [
  { name: 'Authentication Service', status: 'Operational', uptime: '99.99%' },
  { name: 'Document Processor', status: 'Operational', uptime: '99.95%' },
  { name: 'Vector Database', status: 'Degraded', uptime: '98.50%' },
  { name: 'Chat Completion API', status: 'Operational', uptime: '99.99%' },
  { name: 'Email Notification', status: 'Operational', uptime: '100%' },
];
