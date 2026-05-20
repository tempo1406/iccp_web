import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { quickAccessItems } from './admin-data';

export function AdminQuickAccessGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {quickAccessItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <item.icon className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
