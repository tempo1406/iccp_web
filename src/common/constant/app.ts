export const appConfig = {
  /** Application display name */
  name: 'ICCP',
  /** Full name */
  fullName: 'Intelligent Content & Collaboration Platform',

  /** API base URL — used by the legacy apiFetch client */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',

  /** AI service base URL (iccp_be_ai) */
  aiBaseUrl: process.env.NEXT_PUBLIC_AI_BASE_URL ?? 'http://localhost:8001',

  /** tRPC endpoint (relative in browser, full URL on server) */
  trpcUrl: '/api/trpc',

  /** Environment */
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  /** Pagination defaults */
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  /**
   * Document upload limits — must stay in sync with:
   *   be_core: MAX_FILE_SIZE + ALLOWED_MIME_TYPES in core.controller.ts
   *   be_ai:   ALLOWED_FILE_TYPES in file_parser_service.py
   *
   * Note: .doc (old binary Word) is intentionally excluded — use .docx.
   */
  upload: {
    maxFileSizeMb: 100,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',                                                 // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
      'text/plain',
      'text/markdown',
    ] as const,
    /** <input accept="…"> value */
    acceptAttr: '.pdf,.docx,.xlsx,.xls,.txt,.md',
    /** Human-readable label cho toast / hint text */
    acceptLabel: 'PDF, DOCX, XLSX, XLS, TXT, MD',
  },
} as const;

// ─── Shared document file validator ────────────────────────────────────────────

/**
 * Validate a File object against upload rules.
 * Returns an error message string, or null if the file is valid.
 *
 * Usage: const err = validateDocumentFile(file); if (err) toast.danger(err);
 */
export function validateDocumentFile(file: File): string | null {
  const { maxFileSizeMb, allowedMimeTypes, acceptLabel } = appConfig.upload;

  if (file.size === 0) return 'File is empty.';

  const maxBytes = maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File exceeds the ${maxFileSizeMb} MB size limit.`;
  }

  if (file.type && !(allowedMimeTypes as readonly string[]).includes(file.type)) {
    return `Unsupported file type "${file.type}". Allowed: ${acceptLabel}.`;
  }

  return null;
}
