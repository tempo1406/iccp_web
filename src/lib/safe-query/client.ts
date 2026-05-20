/**
 * src/lib/safe-query/client.ts
 *
 * Client-side safe query hooks — wraps tRPC useQuery / useMutation
 * with standardized state shape: { data, error, status, isEmpty }.
 *
 * Design goals:
 *  1. Uniform API across all features — no raw isLoading/isError/data juggling
 *  2. Normalized AppError (from tRPC, HTTP, or unknown)
 *  3. Type-safe field errors for form validation (from Zod)
 *  4. isEmpty detection (null | undefined | empty array)
 *
 * Usage:
 *   const q = useSafeQuery(trpc.projects.list, { page: 1 });
 *   if (q.isPending) return <Spinner />;
 *   if (q.isError)   return <Alert>{q.error.message}</Alert>;
 *   if (q.isEmpty)   return <Empty />;
 *   return <List data={q.data} />;
 */

'use client';

import { normalizeError, type AppError, type Result, ok, errFrom } from './result';

// ---------------------------------------------------------------------------
// Safe query state
// ---------------------------------------------------------------------------

export type SafeQueryStatus = 'pending' | 'success' | 'error';

export interface SafeQueryResult<T> {
  /** The resolved data — defined only when status === "success" */
  data: T | undefined;
  /** Normalized error — defined only when status === "error" */
  error: AppError | null;
  /** Current status */
  status: SafeQueryStatus;
  /** Shorthand booleans */
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  /** True when data is null, undefined, or an empty array */
  isEmpty: boolean;
  /** Original raw tRPC query result (for escape hatch) */
  raw: unknown;
}

export interface SafeMutationResult<TData, TVariables> {
  /** Call the mutation */
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<Result<TData>>;
  /** Normalized error from last mutation */
  error: AppError | null;
  /** Zod field errors for form integration */
  fieldErrors: Record<string, string[]> | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  /** Reset mutation state */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// useSafeQuery
// ---------------------------------------------------------------------------

/**
 * Wraps any tRPC useQuery result into a normalized SafeQueryResult.
 *
 * Example:
 *   const q = useSafeQuery(trpc.projects.list.useQuery({ page: 1 }));
 */
export function useSafeQuery<T>(queryResult: {
  data: T | undefined;
  error: unknown;
  status: 'pending' | 'success' | 'error';
  isLoading?: boolean;
  isFetching?: boolean;
}): SafeQueryResult<T> {
  const { data, error, status } = queryResult;

  const isEmpty =
    data === null ||
    data === undefined ||
    (Array.isArray(data) ? data.length === 0 : false);

  return {
    data,
    error: error ? normalizeError(error) : null,
    status,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    isEmpty,
    raw: queryResult,
  };
}

// ---------------------------------------------------------------------------
// useSafeMutation
// ---------------------------------------------------------------------------

/**
 * Wraps any tRPC useMutation result into a normalized SafeMutationResult.
 *
 * Example:
 *   const m = useSafeMutation(trpc.projects.create.useMutation({ onSuccess }));
 *   m.mutate({ name: "My Project" });
 *   if (m.isError) toast.error(m.error?.message);
 *   if (m.fieldErrors?.name) setError("name", m.fieldErrors.name[0]);
 */
export function useSafeMutation<TData, TVariables>(mutationResult: {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  error: unknown;
  status: 'idle' | 'pending' | 'success' | 'error';
  reset: () => void;
}): SafeMutationResult<TData, TVariables> {
  const { mutate, mutateAsync, error, status, reset } = mutationResult;

  const normalizedError = error ? normalizeError(error) : null;

  const mutateAsyncSafe = async (variables: TVariables): Promise<Result<TData>> => {
    try {
      const data = await mutateAsync(variables);
      return ok(data);
    } catch (e) {
      return errFrom(e);
    }
  };

  return {
    mutate,
    mutateAsync: mutateAsyncSafe,
    error: normalizedError,
    fieldErrors: normalizedError?.fieldErrors ?? null,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    reset,
  };
}

// ---------------------------------------------------------------------------
// createSafeQueryUtils (factory)
// ---------------------------------------------------------------------------

/**
 * Factory that creates pre-configured safe wrappers for a specific tRPC procedure family.
 * Use this to avoid repeating useSafeQuery / useSafeMutation in every hook file.
 *
 * Example (inside a feature hook file):
 *
 *   // Basic usage:
 *   export function useProjectList(input) {
 *     return useSafeQuery(trpc.projects.list.useQuery(input, opts));
 *   }
 *
 *   // Or compose with useSafeMutation:
 *   export function useCreateProject() {
 *     const utils = trpc.useUtils();
 *     return useSafeMutation(
 *       trpc.projects.create.useMutation({
 *         onSuccess: () => void utils.projects.list.invalidate(),
 *       })
 *     );
 *   }
 */
export { useSafeQuery as wrapQuery, useSafeMutation as wrapMutation };
