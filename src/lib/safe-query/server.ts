/**
 * src/lib/safe-query/server.ts
 *
 * Server Component–level safe query helpers.
 * Wraps serverTrpc calls in Result<T> so Server Components don't need try/catch.
 *
 * ⚠️ This file is guarded by "server-only" — never import in Client Components.
 *
 * Usage (Server Component / layout):
 *   import { safePageQuery, safePageQueryAll } from "@/lib/safe-query/server";
 *   import { serverTrpc } from "@/config/trpc/server";
 *
 *   const result = await safePageQuery(() =>
 *     serverTrpc.projects.list({ page: 1 })
 *   );
 *   if (!result.ok) return <ErrorMessage error={result.error} />;
 *   return <ProjectList data={result.data} />;
 */

import 'server-only';

import { ok, errFrom, type Result } from './result';

/**
 * Wraps any serverTrpc call (or other async operation) in a Result<T>.
 * Never throws — errors are captured in result.error.
 */
export async function safePageQuery<T>(
  fn: () => Promise<T>,
  fallbackMessage?: string,
): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return errFrom(e, fallbackMessage);
  }
}

/**
 * Parallel version — runs all queries concurrently.
 * Each query result is independent (one failure doesn't cancel others).
 *
 * Usage:
 *   const [projects, documents] = await safePageQueryAll(
 *     () => serverTrpc.projects.list({ page: 1 }),
 *     () => serverTrpc.documents.list({ page: 1 }),
 *   );
 */
export async function safePageQueryAll<T extends readonly (() => Promise<unknown>)[]>(
  ...fns: T
): Promise<{ [K in keyof T]: Result<Awaited<ReturnType<T[K]>>> }> {
  return Promise.all(fns.map((fn) => safePageQuery(fn))) as Promise<{
    [K in keyof T]: Result<Awaited<ReturnType<T[K]>>>;
  }>;
}

/**
 * Sequential chain — fn2 receives fn1's data if fn1 succeeds.
 * Returns Err from fn1 immediately if it fails.
 */
export async function safePageQueryChain<A, B>(
  fn1: () => Promise<A>,
  fn2: (a: A) => Promise<B>,
): Promise<Result<B>> {
  const r1 = await safePageQuery(fn1);
  if (!r1.ok) return r1;
  return safePageQuery(() => fn2(r1.data));
}
