export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  avatar?: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description: string;
  permissions: number;
  users: number;
}

export const mockUsers: UserItem[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Admin',
    department: 'Engineering',
    status: 'active',
    lastActive: '2 min ago',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'Editor',
    department: 'Marketing',
    status: 'active',
    lastActive: '1 hour ago',
  },
  {
    id: '3',
    name: 'Mike Park',
    email: 'mike.park@company.com',
    role: 'Viewer',
    department: 'Sales',
    status: 'pending',
    lastActive: 'Never',
  },
  {
    id: '4',
    name: 'Lisa Nguyen',
    email: 'lisa.nguyen@company.com',
    role: 'Editor',
    department: 'Product',
    status: 'active',
    lastActive: '5 hours ago',
  },
  {
    id: '5',
    name: 'Alex Kim',
    email: 'alex.kim@company.com',
    role: 'Viewer',
    department: 'Finance',
    status: 'inactive',
    lastActive: '2 weeks ago',
  },
];

export const mockRoles: RoleItem[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full access to all features and settings',
    permissions: 24,
    users: 3,
  },
  {
    id: '2',
    name: 'Editor',
    description: 'Can create, edit, and delete documents',
    permissions: 16,
    users: 12,
  },
  {
    id: '3',
    name: 'Viewer',
    description: 'Read-only access to documents and chatbot',
    permissions: 8,
    users: 45,
  },
  {
    id: '4',
    name: 'API User',
    description: 'Programmatic access via API only',
    permissions: 4,
    users: 8,
  },
];
