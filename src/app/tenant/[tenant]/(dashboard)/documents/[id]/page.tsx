import { DocumentDetailPage } from '@/features/tenant/documents/pages/document-detail-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentDetailPage id={id} />;
}
