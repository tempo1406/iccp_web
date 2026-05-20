'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/providers';
import { mockRoles, mockUsers } from './users-data';
import { RolesGrid } from './roles-grid';
import { UsersStatsGrid } from './users-stats-grid';
import { UsersTable } from './users-table';
import { UsersToolbar } from './users-toolbar';

export function UsersPage() {
  const { tenantSlug } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter((user) => user.status === 'active').length,
    pending: mockUsers.filter((user) => user.status === 'pending').length,
    roles: mockRoles.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Manage team members and their access permissions."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.tenant.dashboard(tenantSlug) },
          { label: 'Users' },
        ]}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <UsersStatsGrid
        total={stats.total}
        active={stats.active}
        pending={stats.pending}
        roles={stats.roles}
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersToolbar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
          <UsersTable users={filteredUsers} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Define roles and manage permissions for your organization.
            </p>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>

          <RolesGrid roles={mockRoles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
