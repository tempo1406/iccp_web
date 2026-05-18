import type { ReactNode } from 'react';
import { FileText, Settings, Shield, User } from 'lucide-react';

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  role: string;
  target: string;
  timestamp: string;
  status: 'success' | 'failed';
  ip: string;
  category: string;
  userAgent?: string;
  sessionId?: string;
  location?: string;
  details?: Record<string, string>;
}

export const auditLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    action: 'User Login',
    actor: 'john.doe@company.com',
    role: 'Admin',
    target: 'System',
    timestamp: '2026-02-09 10:30:45',
    status: 'success',
    ip: '192.168.1.1',
    category: 'Authentication',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    sessionId: 'sess_8f92a3b1c4d5e6f7',
    location: 'Ho Chi Minh City, Vietnam',
    details: {
      'Login Method': 'SSO (Google Workspace)',
      '2FA Used': 'Yes',
      'Session Duration': '8 hours',
    },
  },
  {
    id: 'LOG-002',
    action: 'Delete Document',
    actor: 'sarah.chen@company.com',
    role: 'Editor',
    target: 'Q3-Report.pdf',
    timestamp: '2026-02-09 10:28:12',
    status: 'success',
    ip: '192.168.1.5',
    category: 'Document',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    sessionId: 'sess_2c4d6e8f0a1b3c5d',
    location: 'Singapore',
    details: {
      'Document ID': 'doc_q3r2024',
      'File Size': '2.4 MB',
      'Soft Delete': 'No (Permanent)',
      Reason: 'Outdated version',
    },
  },
  {
    id: 'LOG-003',
    action: 'Update Settings',
    actor: 'mike.park@company.com',
    role: 'Admin',
    target: 'Security Policy',
    timestamp: '2026-02-09 09:15:00',
    status: 'failed',
    ip: '192.168.1.12',
    category: 'Configuration',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0',
    sessionId: 'sess_7a8b9c0d1e2f3a4b',
    location: 'Seoul, South Korea',
    details: {
      Setting: 'password_policy.min_length',
      'Old Value': '8',
      'New Value (Attempted)': '6',
      'Failure Reason': 'Value below minimum security threshold',
    },
  },
  {
    id: 'LOG-004',
    action: 'View Document',
    actor: 'alex.kim@company.com',
    role: 'Viewer',
    target: 'Employee-Handbook.pdf',
    timestamp: '2026-02-09 08:45:33',
    status: 'success',
    ip: '192.168.1.8',
    category: 'Document',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15',
    sessionId: 'sess_5e6f7a8b9c0d1e2f',
    location: 'Tokyo, Japan',
    details: {
      'Document ID': 'doc_eh2024',
      'View Duration': '12 minutes',
      'Pages Viewed': '1-15',
      Downloaded: 'No',
    },
  },
  {
    id: 'LOG-005',
    action: 'Failed Login Attempt',
    actor: 'unknown',
    role: '-',
    target: 'System',
    timestamp: '2026-02-09 03:22:11',
    status: 'failed',
    ip: '45.22.11.99',
    category: 'Security',
    userAgent: 'curl/7.88.1',
    sessionId: '-',
    location: 'Unknown (VPN/Proxy detected)',
    details: {
      'Attempted Username': 'admin@company.com',
      'Attempt Count': '47 in last hour',
      'Blocked By': 'Rate Limiter',
      Action: 'IP temporarily blocked',
    },
  },
];

export function getAuditActionIcon(action: string): ReactNode {
  if (action.includes('Login')) {
    return <User className="text-muted-foreground h-4 w-4" />;
  }
  if (action.includes('Settings')) {
    return <Settings className="text-muted-foreground h-4 w-4" />;
  }
  if (action.includes('Security')) {
    return <Shield className="text-muted-foreground h-4 w-4" />;
  }
  return <FileText className="text-muted-foreground h-4 w-4" />;
}

export function getAuditCategoryColor(category: string): string {
  switch (category) {
    case 'Authentication':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
    case 'Document':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
    case 'Configuration':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
    case 'Security':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}
