import { BaseService } from '@/services/base-service';
import type {
  CreateTemplateBody,
  LandingPageDraftDto,
  LandingPageDto,
  LandingPageTemplateDto,
  UpdateTemplateBody,
  UpsertLandingPageBody,
  UpsertLandingPageDraftBody,
} from '../types/landing-page.types';

export class LandingPageService extends BaseService {
  private readonly base = '/v1/organizations';

  getLandingPage(slug: string): Promise<LandingPageDto | null> {
    return this.get<LandingPageDto | null>(`${this.base}/${slug}/landing-page`);
  }

  upsertLandingPage(orgId: string, body: UpsertLandingPageBody): Promise<LandingPageDto> {
    return this.put<LandingPageDto, UpsertLandingPageBody>(
      `${this.base}/${orgId}/landing-page`,
      body,
    );
  }

  getLandingPageDraft(orgId: string): Promise<LandingPageDraftDto | null> {
    return this.get<LandingPageDraftDto | null>(`${this.base}/${orgId}/landing-page-draft`);
  }

  upsertLandingPageDraft(
    orgId: string,
    body: UpsertLandingPageDraftBody,
  ): Promise<LandingPageDraftDto> {
    return this.put<LandingPageDraftDto, UpsertLandingPageDraftBody>(
      `${this.base}/${orgId}/landing-page-draft`,
      body,
    );
  }

  listTemplates(orgId: string): Promise<LandingPageTemplateDto[]> {
    return this.get<LandingPageTemplateDto[]>(
      `${this.base}/${orgId}/landing-page-templates`,
    );
  }

  getTemplate(orgId: string, templateId: string): Promise<LandingPageTemplateDto> {
    return this.get<LandingPageTemplateDto>(
      `${this.base}/${orgId}/landing-page-templates/${templateId}`,
    );
  }

  createTemplate(orgId: string, body: CreateTemplateBody): Promise<LandingPageTemplateDto> {
    return this.post<LandingPageTemplateDto, CreateTemplateBody>(
      `${this.base}/${orgId}/landing-page-templates`,
      body,
    );
  }

  updateTemplate(
    orgId: string,
    templateId: string,
    body: UpdateTemplateBody,
  ): Promise<LandingPageTemplateDto> {
    return this.patch<LandingPageTemplateDto, UpdateTemplateBody>(
      `${this.base}/${orgId}/landing-page-templates/${templateId}`,
      body,
    );
  }

  deleteTemplate(orgId: string, templateId: string): Promise<void> {
    return this.delete<void>(
      `${this.base}/${orgId}/landing-page-templates/${templateId}`,
    );
  }
}
