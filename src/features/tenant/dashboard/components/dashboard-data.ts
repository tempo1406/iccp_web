import type { LucideIcon } from 'lucide-react';
import { Clock, FileText, MessageSquare, TrendingUp, Users } from 'lucide-react';

export interface DashboardKpi {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
}

export interface DashboardActivity {
  id: number;
  type: 'document' | 'query' | 'user';
  action: string;
  title: string;
  user: string;
  time: string;
}

export interface DashboardTask {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string;
}

export interface DashboardQuickStat {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const kpiData: DashboardKpi[] = [
  {
    title: 'Total Documents',
    value: '1,284',
    change: '+12%',
    trend: 'up',
    icon: FileText,
  },
  {
    title: 'AI Queries Today',
    value: '856',
    change: '+24%',
    trend: 'up',
    icon: MessageSquare,
  },
  { title: 'Active Users', value: '128', change: '+8%', trend: 'up', icon: Users },
  {
    title: 'Accuracy Rate',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
  },
];

export const recentActivity: DashboardActivity[] = [
  {
    id: 1,
    type: 'document',
    action: 'indexed',
    title: 'Q4 Financial Report.pdf',
    user: 'John Doe',
    time: '2 min ago',
  },
  {
    id: 2,
    type: 'query',
    action: 'answered',
    title: 'What is our refund policy?',
    user: 'AI Assistant',
    time: '5 min ago',
  },
  {
    id: 3,
    type: 'user',
    action: 'joined',
    title: 'Sarah Wilson',
    user: 'Admin',
    time: '10 min ago',
  },
  {
    id: 4,
    type: 'document',
    action: 'uploaded',
    title: 'Employee Handbook 2026.pdf',
    user: 'HR Team',
    time: '15 min ago',
  },
  {
    id: 5,
    type: 'query',
    action: 'answered',
    title: 'How to request time off?',
    user: 'AI Assistant',
    time: '20 min ago',
  },
];

export const pendingTasks: DashboardTask[] = [
  {
    id: 1,
    title: 'Review Q4 Financial Report',
    priority: 'high',
    dueDate: 'Today',
    assignee: 'You',
  },
  {
    id: 2,
    title: 'Approve document access request',
    priority: 'medium',
    dueDate: 'Tomorrow',
    assignee: 'You',
  },
  {
    id: 3,
    title: 'Update chatbot training data',
    priority: 'low',
    dueDate: 'This week',
    assignee: 'AI Team',
  },
];

export const quickStats: DashboardQuickStat[] = [
  { label: 'Documents Indexed Today', value: '47', icon: FileText },
  { label: 'Queries Answered', value: '234', icon: MessageSquare },
  { label: 'Active Sessions', value: '18', icon: Users },
  { label: 'Avg Response Time', value: '1.2s', icon: Clock },
];
