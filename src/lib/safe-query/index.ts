/**
 * src/lib/safe-query/index.ts
 *
 * Public API cho safe-query library.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  IMPORT MAP                                                              │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │                                                                          │
 * │  🖥️  Inside SERVER COMPONENTS / layouts (RSC):                          │
 * │     import { safePageQuery, safePageQueryAll }                           │
 * │       from "@/lib/safe-query/server";                                   │
 * │                                                                          │
 * │  💻 Inside CLIENT COMPONENTS ("use client"):                            │
 * │     import { useSafeQuery, useSafeMutation }                            │
 * │       from "@/lib/safe-query";                                          │
 * │                                                                          │
 * │  🔑 Result type + utilities (isomorphic):                               │
 * │     import { ok, err, isOk, isNotFound }                                │
 * │       from "@/lib/safe-query";                                          │
 * │                                                                          │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

// ── Result types & constructors (isomorphic) ─────────────────────────────────
export type { Result, Ok, Err, AppError, TRPCErrorCode } from './result';
export {
  ok,
  err,
  errFrom,
  normalizeError,
  unwrap,
  mapResult,
  mapResultAsync,
  getOrElse,
} from './result';

// ── Client hooks (use only in "use client" files) ────────────────────────────
export type { SafeQueryResult, SafeMutationResult, SafeQueryStatus } from './client';
export { useSafeQuery, useSafeMutation } from './client';

// ── Type guards (isomorphic) ─────────────────────────────────────────────────
export {
  isOk,
  isErr,
  isUnauthorized,
  isForbidden,
  isNotFound,
  isBadRequest,
  isServerError,
  hasFieldErrors,
  getFieldError,
  flatFieldErrors,
} from './guards';

