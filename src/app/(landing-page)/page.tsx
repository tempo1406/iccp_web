import { LandingBillingSection } from '@/features/common/platform/components/landing-billing-section';
import { LandingHeader } from '@/features/common/platform/components/landing-header';
import { LandingHeroSection } from '@/features/common/platform/components/landing-hero-section';
import { LandingRagEngineSection } from '@/features/common/platform/components/landing-rag-engine-section';
import { LandingFeaturesSection } from '@/features/common/platform/components/landing-features-section';
import { LandingLiveDemoSection } from '@/features/common/platform/components/landing-live-demo-section';
import { LandingCtaSection } from '@/features/common/platform/components/landing-cta-section';
import { LandingFooter } from '@/features/common/platform/components/landing-footer';
import { LandingLayout } from '@/features/common/platform/components/landing-layout';

export default function LandingPage() {
  return (
    <LandingLayout>
      <LandingHeader />
      <main>
        <LandingHeroSection />
        <LandingFeaturesSection />
        <LandingRagEngineSection />
        <LandingLiveDemoSection />
        <LandingBillingSection />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </LandingLayout>
  );
}
