import { Bell } from 'lucide-react';

interface EmptyListProps {
  message: string;
}

export function EmptyList({ message }: EmptyListProps) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-12">
      <Bell className="h-8 w-8 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
