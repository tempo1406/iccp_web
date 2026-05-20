import { Globe, Key, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { botPersonas, type BotPersonaId } from './branding-data';

interface BrandingEditorProps {
  primaryColor: string;
  botName: string;
  selectedPersona: BotPersonaId;
  ssoEnabled: boolean;
  ipWhitelist: boolean;
  onPrimaryColorChange: (value: string) => void;
  onBotNameChange: (value: string) => void;
  onPersonaChange: (value: BotPersonaId) => void;
  onSsoEnabledChange: (value: boolean) => void;
  onIpWhitelistChange: (value: boolean) => void;
}

export function BrandingEditor({
  primaryColor,
  botName,
  selectedPersona,
  ssoEnabled,
  ipWhitelist,
  onPrimaryColorChange,
  onBotNameChange,
  onPersonaChange,
  onSsoEnabledChange,
  onIpWhitelistChange,
}: BrandingEditorProps) {
  return (
    <div className="space-y-6 lg:col-span-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Chatbot Appearance</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Customize how the bot looks to your internal employees.
            </p>
          </div>
          <Badge className="border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
            Live
          </Badge>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label className="mb-3 block">Company Logo</Label>
            <div className="flex items-start gap-6">
              <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-lg border">
                <img
                  src="/logo-placeholder.png"
                  alt="Company logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="logo-upload"
                  className="group bg-muted/50 hover:bg-muted flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <div className="flex flex-col items-center justify-center py-5">
                    <Upload className="text-muted-foreground group-hover:text-primary mb-2 h-6 w-6 transition-colors" />
                    <p className="text-muted-foreground mb-1 text-sm">
                      <span className="text-primary font-semibold">Click to upload</span>{' '}
                      or drag and drop
                    </p>
                    <p className="text-muted-foreground text-xs">
                      SVG, PNG, JPG or GIF (MAX. 2MB)
                    </p>
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Primary Brand Color</Label>
              <p className="text-muted-foreground mb-3 text-xs">
                Used for the chat bubble, buttons, and accents.
              </p>
              <div className="flex items-center gap-3">
                <div className="ring-primary relative h-10 w-10 cursor-pointer overflow-hidden rounded-full border shadow-sm ring-2 ring-offset-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => onPrimaryColorChange(event.target.value)}
                    className="absolute -top-2 -left-2 h-16 w-16 cursor-pointer border-0"
                  />
                </div>
                <div className="bg-background flex flex-1 items-center rounded-lg border px-3 py-2">
                  <span className="text-muted-foreground mr-2 text-sm">#</span>
                  <Input
                    value={primaryColor.replace('#', '')}
                    onChange={(event) => onPrimaryColorChange(`#${event.target.value}`)}
                    className="h-auto border-0 p-0 font-mono uppercase focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Bot Name</Label>
              <p className="text-muted-foreground mb-3 text-xs">
                The display name shown in the chat header.
              </p>
              <Input
                value={botName}
                onChange={(event) => onBotNameChange(event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Bot Persona & Tone</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {botPersonas.map((persona) => (
                <label key={persona.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="persona"
                    value={persona.id}
                    checked={selectedPersona === persona.id}
                    onChange={(event) =>
                      onPersonaChange(event.target.value as BotPersonaId)
                    }
                    className="peer sr-only"
                  />
                  <div className="bg-background hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-primary rounded-lg border p-4 text-center transition-all peer-checked:ring-1">
                    <persona.icon className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
                    <p className="text-sm font-medium">{persona.label}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Access & Security</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure who can access the bot.
            </p>
          </div>
          <Button variant="link" size="sm" className="text-primary">
            Edit settings
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Key className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-sm font-medium">SSO / SAML Integration</p>
                <p className="text-muted-foreground text-xs">
                  Connect with your identity provider
                </p>
              </div>
            </div>
            <Switch checked={ssoEnabled} onCheckedChange={onSsoEnabledChange} />
          </div>
          <div className="bg-muted flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Globe className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-sm font-medium">IP Whitelist</p>
                <p className="text-muted-foreground text-xs">
                  Restrict access to specific IP ranges
                </p>
              </div>
            </div>
            <Switch checked={ipWhitelist} onCheckedChange={onIpWhitelistChange} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
