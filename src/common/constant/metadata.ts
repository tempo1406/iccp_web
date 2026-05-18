export const APP_DEFAULT_TITLE = 'ICCP - Intelligent Content & Collaboration Platform';
export const APP_DEFAULT_DESCRIPTION =
  'AI-powered document management and chatbot platform';
export const APP_DEFAULT_ICON = '/vercel.svg';
export const APP_LOADING_ICON =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2232%22%20r%3D%2224%22%20fill%3D%22white%22/%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2232%22%20r%3D%2218%22%20fill%3D%22none%22%20stroke%3D%22%23d7e3f9%22%20stroke-width%3D%228%22/%3E%3Cpath%20d%3D%22M32%2014a18%2018%200%200%201%2012.73%205.27%22%20fill%3D%22none%22%20stroke%3D%22%234f46e5%22%20stroke-linecap%3D%22round%22%20stroke-width%3D%228%22%3E%3CanimateTransform%20attributeName%3D%22transform%22%20attributeType%3D%22XML%22%20type%3D%22rotate%22%20from%3D%220%2032%2032%22%20to%3D%22360%2032%2032%22%20dur%3D%221s%22%20repeatCount%3D%22indefinite%22/%3E%3C/path%3E%3C/svg%3E';

function toTitleCasePart(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatTenantLabel(tenant: string): string {
  const normalized = tenant.trim();
  if (!normalized) return 'Workspace';
  return normalized
    .split('-')
    .filter(Boolean)
    .map((part) => toTitleCasePart(part))
    .join(' ');
}

export function buildTenantTitle(nameOrSlug: string): string {
  return `${nameOrSlug} `;
}

export function buildTenantDescription(
  nameOrSlug: string,
  description?: string | null,
): string {
  const normalizedDescription = description?.trim();
  if (normalizedDescription) return normalizedDescription;
  return `${nameOrSlug} workspace on ICCP Platform.`;
}
