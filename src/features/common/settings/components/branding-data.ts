import { GraduationCap, Smile, Zap } from 'lucide-react';

export const botPersonas = [
  { id: 'friendly', label: 'Friendly', icon: Smile },
  { id: 'professional', label: 'Professional', icon: GraduationCap },
  { id: 'concise', label: 'Concise', icon: Zap },
] as const;

export type BotPersonaId = (typeof botPersonas)[number]['id'];
