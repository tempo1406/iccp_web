export interface LandingPageDto {
  id: string;
  organizationId: string;
  rawHtml?: string;
  projectData?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLandingPageBody {
  rawHtml?: string;
  projectData?: string;
  isPublished?: boolean;
}

export type LandingPageAiGenerationMode = 'generate' | 'modify';
export type LandingPageAiConversationRole = 'user' | 'assistant';
export type LandingPageAiConversationStatus =
  | 'streaming'
  | 'done'
  | 'error'
  | 'stopped';
export type LandingPageEditorSource = 'active' | 'template' | 'scratch';

export interface LandingPageDraftConversationMessageDto {
  id: string;
  role: LandingPageAiConversationRole;
  content: string;
  mode?: LandingPageAiGenerationMode;
  status?: LandingPageAiConversationStatus;
  tokensUsed?: number;
}

export interface LandingPagePendingDraftDto {
  messageId: string;
  mode: LandingPageAiGenerationMode;
  html: string;
  partial: boolean;
  tokensUsed?: number;
}

export interface LandingPageDraftDto {
  id: string;
  organizationId: string;
  userId: string;
  rawHtml?: string | null;
  projectData?: string | null;
  aiConversation: LandingPageDraftConversationMessageDto[];
  currentTemplateId?: string | null;
  source: LandingPageEditorSource;
  pendingDraft?: LandingPagePendingDraftDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLandingPageDraftBody {
  rawHtml?: string | null;
  projectData?: string | null;
  aiConversation?: LandingPageDraftConversationMessageDto[];
  currentTemplateId?: string | null;
  source?: LandingPageEditorSource;
  pendingDraft?: LandingPagePendingDraftDto | null;
}

export interface LandingPageTemplateDto {
  id: string;
  organizationId: string;
  name: string;
  html: string;
  projectData?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateBody {
  name: string;
  html: string;
  projectData?: string;
  thumbnailUrl?: string;
}

export interface UpdateTemplateBody {
  name?: string;
  html?: string;
  projectData?: string;
  thumbnailUrl?: string;
}

export interface SubmitLandingPageLeadBody {
  formType?: string;
  formName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
  pageUrl?: string;
  fields?: Record<string, string>;
}

export interface LandingPageLeadDto {
  id: string;
  organizationId: string;
  landingPageId?: string | null;
  formType: string;
  formName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  pageUrl?: string | null;
  fields?: Record<string, string> | null;
  submittedAt: string;
  createdAt: string;
}

export type EditorMode = 'visual' | 'code';

export const LANDING_PAGE_TEMPLATE_ID_META_KEY = '__templateId';
