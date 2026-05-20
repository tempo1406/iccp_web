import { DocumentReviewPage } from '@/features/tenant/documents/pages/document-review-page';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <DocumentReviewPage documentId={id} />;
}
