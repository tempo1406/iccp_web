import { Card, CardContent } from '@/components/ui/card';

interface SettingsEmptyTabProps {
  message: string;
}

export function SettingsEmptyTab({ message }: SettingsEmptyTabProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
