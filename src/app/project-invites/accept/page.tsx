import { Suspense } from 'react';
import { AcceptProjectInvitePage } from '@/features/tenant/projects/components/accept-project-invite-page';

export default function ProjectInvitesAcceptPage() {
  return (
    <Suspense fallback={null}>
      <AcceptProjectInvitePage />
    </Suspense>
  );
}
