export interface MonitoredFolder {
  name: string;
  path: string;
  status: 'Synced' | 'Pending';
}

export const monitoredFolders: MonitoredFolder[] = [
  { name: 'Company Shared Drive', path: '/Team Drives/Company', status: 'Synced' },
  { name: 'Financial Reports', path: '/Finance/Reports', status: 'Synced' },
  { name: 'HR Policies', path: '/HR/Public/Policies', status: 'Synced' },
  { name: 'Engineering Docs', path: '/Eng/Architecture', status: 'Pending' },
];
