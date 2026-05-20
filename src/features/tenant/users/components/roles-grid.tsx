import { MoreVertical, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoleItem } from './users-data';

interface RolesGridProps {
  roles: RoleItem[];
}

export function RolesGrid({ roles }: RolesGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">{role.description}</p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-muted-foreground flex items-center gap-1">
                <Shield className="h-4 w-4" />
                {role.permissions} permissions
              </div>
              <div className="text-muted-foreground flex items-center gap-1">
                <Users className="h-4 w-4" />
                {role.users} users
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
