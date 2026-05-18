export type BotPersona = 'friendly' | 'professional' | 'concise';

export type OrgSize = 'small' | 'medium' | 'large' | 'enterprise';

export interface OrgBranding {
  brandColor?: string;
  botName?: string;
  botPersona?: BotPersona;
}

export interface OrgProfileResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  industry?: string;
  size?: OrgSize;
  isActive: boolean;
  branding?: OrgBranding;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrgGeneralBody {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  contactEmail?: string | null;
}

export interface UpdateOrgBrandingBody {
  brandColor?: string;
  botName?: string;
  botPersona?: BotPersona;
}
