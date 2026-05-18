/**
 * src/lib/safe-query/result.ts
 *
 * Result<T, E> — discriminated union type (Ok | Err).
 * Dùng để trả về từ server queries thay vì throw exceptions.
 *
 * Usage:
 *   function getData(): Result<User> { ... }
 *   const result = getData();
 *   if (result.ok) console.log(result.data);
 *   else console.error(result.error.message);
 */

// ---------------------------------------------------------------------------
// Core Result type
// ---------------------------------------------------------------------------

export type Ok<T> = {
  readonly ok: true;
  readonly data: T;
};

export type Err<E = AppError> = {
  readonly ok: false;
  readonly error: E;
};

export type Result<T, E = AppError> = Ok<T> | Err<E>;

// ---------------------------------------------------------------------------
// AppError — normalized error across the whole app
// ---------------------------------------------------------------------------

export type TRPCErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'TIMEOUT'
  | 'TOO_MANY_REQUESTS'
  | 'UNKNOWN';

export interface AppError {
  /** Human-readable message safe to show in UI */
  message: string;
  /** tRPC / HTTP error code */
  code: TRPCErrorCode;
  /** Full Zod field errors when available */
  fieldErrors?: Record<string, string[]>;
  /** Original error for debugging */
  cause?: unknown;
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err(error: AppError): Err<AppError> {
  return { ok: false, error };
}

/** Convenience — create an Err from any thrown value */
export function errFrom(
  e: unknown,
  fallbackMessage = 'An unexpected error occurred',
): Err<AppError> {
  return { ok: false, error: normalizeError(e, fallbackMessage) };
}

// ---------------------------------------------------------------------------
// Error normalizer
// ---------------------------------------------------------------------------

/**
 * Converts any thrown value (TRPCClientError, HttpError, Error, string…)
 * into a consistent AppError.
 */
export function normalizeError(
  e: unknown,
  fallbackMessage = 'An unexpected error occurred',
): AppError {
  // Lazily import TRPCClientError to avoid bundling server code client-side
  // We match on shape instead of instanceof for isomorphic use.

  // tRPC client error shape: { data?.code, message, data?.zodError }
  if (isTRPCClientError(e)) {
    const code = mapTRPCCode(e.data?.code as string | undefined);
    const fieldErrors = e.data?.zodError?.fieldErrors as
      | Record<string, string[]>
      | undefined;

    return {
      message: e.message || fallbackMessage,
      code,
      fieldErrors,
      cause: e,
    };
  }

  if (e instanceof Error) {
    return { message: e.message || fallbackMessage, code: 'UNKNOWN', cause: e };
  }

  if (typeof e === 'string') {
    return { message: e || fallbackMessage, code: 'UNKNOWN', cause: e };
  }

  return { message: fallbackMessage, code: 'UNKNOWN', cause: e };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isTRPCClientError(
  e: unknown,
): e is {
  message: string;
  data?: { code?: string; zodError?: { fieldErrors?: unknown } };
} {
  return (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    // tRPC errors always have a `data` property
    ('data' in e || 'shape' in e)
  );
}

function mapTRPCCode(code: string | undefined): TRPCErrorCode {
  const map: Record<string, TRPCErrorCode> = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    TIMEOUT: 'TIMEOUT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    PARSE_ERROR: 'BAD_REQUEST',
    METHOD_NOT_SUPPORTED: 'BAD_REQUEST',
    PAYLOAD_TOO_LARGE: 'BAD_REQUEST',
  };
  return map[code ?? ''] ?? 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Unwrap a Result — throws if Err. Use only when you're sure it's Ok. */
export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.data;
  throw new Error(`[safe-query] unwrap() called on Err: ${result.error.message}`);
}

/** Map the Ok value of a Result */
export function mapResult<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
  if (result.ok) return ok(fn(result.data));
  return result;
}

/** Async version of mapResult */
export async function mapResultAsync<T, U>(
  result: Result<T>,
  fn: (data: T) => Promise<U>,
): Promise<Result<U>> {
  if (result.ok) return ok(await fn(result.data));
  return result;
}

/** Return a default value if Err */
export function getOrElse<T>(result: Result<T>, defaultValue: T): T {
  return result.ok ? result.data : defaultValue;
}
