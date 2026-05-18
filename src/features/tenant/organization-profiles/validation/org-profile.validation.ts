import { z } from 'zod';

interface OrgProfileValidationMessages {
  nameMax: string;
  websiteMax: string;
  websiteUrl: string;
  emailMax: string;
  emailFormat: string;
  brandColorHex: string;
  botNameMax: string;
}

const defaultMessages: OrgProfileValidationMessages = {
  nameMax: 'Name must be at most 255 characters',
  websiteMax: 'Website must be at most 500 characters',
  websiteUrl: 'Website must be a valid URL',
  emailMax: 'Email must be at most 255 characters',
  emailFormat: 'Contact email must be a valid email address',
  brandColorHex: 'Brand color must be a valid hex color (e.g. #3B82F6)',
  botNameMax: 'Bot name must be at most 100 characters',
};

export function createUpdateOrgGeneralSchema(messages = defaultMessages) {
  return z.object({
    name: z.string().max(255, messages.nameMax).optional(),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z
      .string()
      .max(500, messages.websiteMax)
      .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
        message: messages.websiteUrl,
      })
      .optional(),
    contactEmail: z
      .string()
      .max(255, messages.emailMax)
      .refine((val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: messages.emailFormat,
      })
      .optional(),
  });
}

export const updateOrgGeneralSchema = createUpdateOrgGeneralSchema();

export function createUpdateOrgBrandingSchema(messages = defaultMessages) {
  return z.object({
    brandColor: z
      .string()
      .refine((val) => !val || val === '' || /^#[0-9A-Fa-f]{6}$/.test(val), {
        message: messages.brandColorHex,
      })
      .optional(),
    botName: z.string().max(100, messages.botNameMax).optional(),
    botPersona: z.enum(['friendly', 'professional', 'concise']).optional(),
  });
}

export const updateOrgBrandingSchema = createUpdateOrgBrandingSchema();

export type UpdateOrgGeneralForm = z.infer<typeof updateOrgGeneralSchema>;
export type UpdateOrgBrandingForm = z.infer<typeof updateOrgBrandingSchema>;
