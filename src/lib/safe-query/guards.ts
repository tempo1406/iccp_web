/**
 * src/lib/safe-query/guards.ts
 *
 * Type guard utilities for Result and AppError.
 * Use these in render logic for proper TypeScript narrowing.
 *
 * Usage:
 *   if (isOk(result)) { result.data }  // data is T here
 *   if (isAuthError(result.error)) { redirect("/login") }
 *   if (isNotFound(result.error)) { notFound() }
 */

import type { Result, AppError } from './result';

// ---------------------------------------------------------------------------
// Result guards
// ---------------------------------------------------------------------------

export function isOk<T>(result: Result<T>): result is { ok: true; data: T } {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: AppError } {
  return result.ok === false;
}

// ---------------------------------------------------------------------------
// AppError code guards
// ---------------------------------------------------------------------------

export function isUnauthorized(error: AppError | null): boolean {
  return error?.code === 'UNAUTHORIZED';
}

export function isForbidden(error: AppError | null): boolean {
  return error?.code === 'FORBIDDEN';
}

export function isNotFound(error: AppError | null): boolean {
  return error?.code === 'NOT_FOUND';
}

export function isBadRequest(error: AppError | null): boolean {
  return error?.code === 'BAD_REQUEST';
}

export function isServerError(error: AppError | null): boolean {
  return error?.code === 'INTERNAL_SERVER_ERROR';
}

export function hasFieldErrors(
  error: AppError | null,
): error is AppError & { fieldErrors: Record<string, string[]> } {
  return Boolean(error?.fieldErrors && Object.keys(error.fieldErrors).length > 0);
}

// ---------------------------------------------------------------------------
// Convenience: extract first field error message
// ---------------------------------------------------------------------------

/**
 * Returns the first error message for a specific field, or undefined.
 *
 * Usage (with react-hook-form or manual forms):
 *   const nameError = getFieldError(error, "name"); // "Name is required"
 */
export function getFieldError(error: AppError | null, field: string): string | undefined {
  return error?.fieldErrors?.[field]?.[0];
}

/**
 * Returns all field errors as a flat Record<fieldName, firstMessage>.
 * Useful for populating form errors in one go.
 *
 * Usage:
 *   const errors = flatFieldErrors(mutation.error);
 *   setErrors(errors); // react-hook-form compatible
 */
export function flatFieldErrors(error: AppError | null): Record<string, string> {
  if (!error?.fieldErrors) return {};
  return Object.fromEntries(
    Object.entries(error.fieldErrors).map(([key, msgs]) => [key, msgs[0] ?? '']),
  );
}
