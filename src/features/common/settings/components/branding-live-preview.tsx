import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface BrandingLivePreviewProps {
  primaryColor: string;
  botName: string;
}

export function BrandingLivePreview({ primaryColor, botName }: BrandingLivePreviewProps) {
  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle className="text-lg">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="overflow-hidden rounded-xl border shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 50%)`,
            }}
          >
            <div className="p-4 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <p className="font-semibold">{botName}</p>
                  <p className="text-xs opacity-80">Online now</p>
                </div>
              </div>
            </div>

            <div className="bg-background min-h-[200px] space-y-3 p-4">
              <div
                className="max-w-[80%] rounded-lg p-3 text-sm text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Hi there! 👋 How can I help you today?
              </div>
              <div className="bg-muted ml-auto max-w-[80%] rounded-lg p-3 text-sm">
                I need help finding the Q3 report.
              </div>
              <div
                className="max-w-[80%] rounded-lg p-3 text-sm text-white"
                style={{ backgroundColor: primaryColor }}
              >
                I found 3 documents matching &quot;Q3 report&quot;. Would you like me to
                show them?
              </div>
            </div>

            <div className="bg-background border-t p-3">
              <div className="flex items-center gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="sm" style={{ backgroundColor: primaryColor }}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
