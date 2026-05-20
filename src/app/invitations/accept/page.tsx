import { redirect } from 'next/navigation';
import { ROUTES } from '@/common/constant/routes';

type SearchParamValue = string | string[] | undefined;

interface InvitationsAcceptAliasPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

function buildRedirectUrl(searchParams: Record<string, SearchParamValue>): string {
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      query.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    }
  });

  const queryString = query.toString();
  return queryString ? `${ROUTES.inviteAccept}?${queryString}` : ROUTES.inviteAccept;
}

export default async function InvitationsAcceptAliasPage({
  searchParams,
}: InvitationsAcceptAliasPageProps) {
  const resolvedSearchParams = await searchParams;
  redirect(buildRedirectUrl(resolvedSearchParams));
}
