import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, FileText, MessageSquare, Users } from 'lucide-react';

export function DashboardQuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/documents">
        <Card className="group hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Manage Documents</p>
              <p className="text-muted-foreground text-sm">Upload and organize files</p>
            </div>
            <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
          </CardContent>
        </Card>
      </Link>

      <Link href="/chatbot">
        <Card className="group hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">AI Chatbot</p>
              <p className="text-muted-foreground text-sm">Ask questions about docs</p>
            </div>
            <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
          </CardContent>
        </Card>
      </Link>

      <Link href="/team-chat">
        <Card className="group hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-lg">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Team Chat</p>
              <p className="text-muted-foreground text-sm">Communicate with your team</p>
            </div>
            <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
