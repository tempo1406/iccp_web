import type { QuotaMeDto } from '../types';

export interface OrgTokenPoolState {
  limit: number;
  used: number;
  remaining: number;
}

export interface UserDailyTokenBudgetState {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

function pickNonNegativeNumber(values: Array<number | undefined>): number | null {
  const resolved = values.find(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0,
  );
  return resolved ?? null;
}

export function resolveOrgTokenPool(
  quota: QuotaMeDto | null | undefined,
): OrgTokenPoolState | null {
  const organization = quota?.organization;
  if (!organization) return null;

  const limit = pickNonNegativeNumber([
    organization.token_limit,
    organization.monthly_token_limit,
  ]);
  if (limit == null) return null;

  const used =
    pickNonNegativeNumber([
      organization.tokens_used,
      organization.monthly_tokens_used,
    ]) ?? 0;
  const remaining =
    pickNonNegativeNumber([
      organization.tokens_remaining,
      organization.monthly_tokens_remaining,
    ]) ?? Math.max(0, limit - used);

  return {
    limit,
    used,
    remaining,
  };
}

export function getOrgTokenPoolUsedPercentage(
  pool: OrgTokenPoolState | null | undefined,
): number {
  if (!pool || pool.limit <= 0) return 0;
  return Math.min(100, Math.max(0, (pool.used / pool.limit) * 100));
}

export function resolveUserDailyTokenBudget(
  quota: QuotaMeDto | null | undefined,
): UserDailyTokenBudgetState | null {
  const user = quota?.user;
  if (!user) return null;

  const limit = pickNonNegativeNumber([user.daily_token_limit]);
  if (limit == null) return null;

  const used = pickNonNegativeNumber([user.daily_tokens_used]) ?? 0;
  const remaining =
    pickNonNegativeNumber([user.daily_tokens_remaining]) ??
    Math.max(0, limit - used);

  return {
    limit,
    used,
    remaining,
    resetAt: user.reset_at,
  };
}

export function getUserDailyTokenUsedPercentage(
  budget: UserDailyTokenBudgetState | null | undefined,
): number {
  if (!budget || budget.limit <= 0) return 0;
  return Math.min(100, Math.max(0, (budget.used / budget.limit) * 100));
}
