import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { quickLinks } from './settings-data';

export function SettingsQuickLinks() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {quickLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="group hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-md">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors">
                <link.icon className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{link.label}</p>
                  <ChevronRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors" />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{link.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
