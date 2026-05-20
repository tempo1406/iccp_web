import type { LucideIcon } from 'lucide-react';
import { Building, Puzzle, UserCircle, Workflow } from 'lucide-react';

export interface SettingsQuickLink {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const quickLinks: SettingsQuickLink[] = [
  {
    href: '/profile',
    icon: UserCircle,
    label: 'Profile & Preferences',
    description: 'Manage your personal info and settings',
  },
  {
    href: '/settings/branding',
    icon: Building,
    label: 'Organization Branding',
    description: 'Customize chatbot appearance and colors',
  },
  {
    href: '/settings/workflow',
    icon: Workflow,
    label: 'Workflow Automation',
    description: 'Configure approval chains and triggers',
  },
  {
    href: '/settings/integrations',
    icon: Puzzle,
    label: 'Integrations',
    description: 'Connect external apps and services',
  },
];
