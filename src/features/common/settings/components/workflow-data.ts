import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle,
  FileText,
  Gavel,
  GitBranch,
  HelpCircle,
  Shield,
  User,
  Zap,
} from 'lucide-react';

export interface WorkflowItem {
  id: number;
  name: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  status: 'active' | 'draft';
  lastEdited: string;
  tags: string[];
  isActive?: boolean;
}

export interface WorkflowStep {
  id: number;
  type: 'trigger' | 'rule' | 'approval';
  name: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  condition?: string;
  assignee?: string;
  sla?: string;
  badge?: string;
  isSelected?: boolean;
}

export const workflows: WorkflowItem[] = [
  {
    id: 1,
    name: 'IT Security Docs',
    icon: Shield,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 dark:bg-primary/15',
    status: 'active',
    lastEdited: '2m ago',
    tags: ['Security', '3 Steps'],
    isActive: true,
  },
  {
    id: 2,
    name: 'HR Policy Updates',
    icon: Gavel,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 dark:bg-primary/15',
    status: 'active',
    lastEdited: '1h ago',
    tags: ['HR'],
  },
  {
    id: 3,
    name: 'Financial Reports',
    icon: FileText,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    status: 'draft',
    lastEdited: '2d ago',
    tags: ['Finance'],
  },
  {
    id: 4,
    name: 'General FAQs',
    icon: HelpCircle,
    iconColor: 'text-slate-500 dark:text-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    status: 'active',
    lastEdited: '1d ago',
    tags: ['Support'],
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    type: 'trigger',
    name: 'Trigger: Document Uploaded',
    icon: Zap,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 dark:bg-primary/15',
    condition: 'IF Tag contains "Security" OR "Confidential"',
  },
  {
    id: 2,
    type: 'rule',
    name: 'Auto-Approval Logic',
    icon: GitBranch,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/8 dark:bg-primary/12',
    condition: 'Skip approvals if Confidence Score > 95%',
    badge: 'Rule #1',
  },
  {
    id: 3,
    type: 'approval',
    name: 'Security Team Review',
    icon: User,
    iconColor: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-white dark:bg-slate-800',
    assignee: 'Security Team Lead',
    sla: '24 hours',
    badge: 'Step 1',
  },
  {
    id: 4,
    type: 'approval',
    name: 'Compliance Verification',
    icon: CheckCircle,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-white dark:bg-slate-800',
    assignee: 'Compliance Officer',
    sla: '48 hours',
    badge: 'Step 2',
    isSelected: true,
  },
];
