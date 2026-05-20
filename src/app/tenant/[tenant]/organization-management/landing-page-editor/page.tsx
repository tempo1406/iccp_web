'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingPageEditorFullscreen } from '@/features/tenant/landing-page-builder/components/grapes-editor';
import '@/features/tenant/landing-page-builder/components/grapes-editor.css';

export default function LandingPageEditorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 0.8s linear infinite' }} />
        </div>
      }
    >
      <LandingPageEditorFullscreen />
    </Suspense>
  );
}
