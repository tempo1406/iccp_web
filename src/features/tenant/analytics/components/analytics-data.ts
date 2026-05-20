import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, MessageSquare, Target, Users } from 'lucide-react';

export type AnalyticsTrend = 'up' | 'down';

export interface AnalyticsKpi {
  title: string;
  value: string;
  change: string;
  trend: AnalyticsTrend;
  icon: LucideIcon;
}

export interface TopQuestion {
  query: string;
  count: number;
  confidence: number;
}

export interface LowConfidenceAnswer {
  query: string;
  confidence: number;
  timestamp: string;
  department: string;
}

export interface RagSource {
  name: string;
  queries: number;
  percentage: number;
}

export const analyticsKpis: AnalyticsKpi[] = [
  {
    title: 'Total Queries',
    value: '12,486',
    change: '+18%',
    trend: 'up',
    icon: MessageSquare,
  },
  {
    title: 'Avg. Accuracy',
    value: '94.2%',
    change: '+2.4%',
    trend: 'up',
    icon: Target,
  },
  {
    title: 'Active Users',
    value: '856',
    change: '+12%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Low Confidence',
    value: '3.2%',
    change: '-0.8%',
    trend: 'down',
    icon: AlertTriangle,
  },
];

export const topQuestions: TopQuestion[] = [
  { query: 'What is our refund policy?', count: 342, confidence: 96 },
  { query: 'How do I reset my password?', count: 289, confidence: 98 },
  { query: 'What are the working hours?', count: 234, confidence: 94 },
  { query: 'How to request PTO?', count: 198, confidence: 92 },
  { query: 'What is the dress code?', count: 167, confidence: 89 },
];

export const lowConfidenceAnswers: LowConfidenceAnswer[] = [
  {
    query: "What's the budget for Q2 marketing campaign?",
    confidence: 45,
    timestamp: '2 hours ago',
    department: 'Marketing',
  },
  {
    query: 'Can I transfer my benefits to a spouse?',
    confidence: 52,
    timestamp: '5 hours ago',
    department: 'HR',
  },
  {
    query: "What's the approval process for expenses over $10k?",
    confidence: 58,
    timestamp: '1 day ago',
    department: 'Finance',
  },
  {
    query: 'Do we have a partnership with Acme Corp?',
    confidence: 41,
    timestamp: '1 day ago',
    department: 'Sales',
  },
];

export const ragSources: RagSource[] = [
  { name: 'HR Policies', queries: 3240, percentage: 28 },
  { name: 'Financial Reports', queries: 2856, percentage: 24 },
  { name: 'Product Documentation', queries: 2145, percentage: 18 },
  { name: 'Sales Playbooks', queries: 1789, percentage: 15 },
  { name: 'Engineering Docs', queries: 1456, percentage: 12 },
];
