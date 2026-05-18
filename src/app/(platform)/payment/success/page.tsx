import { Suspense } from 'react';
import { PaymentSuccessContent } from './payment-success-content';

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentLoadingView />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentLoadingView() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground text-sm">Processing payment...</div>
    </div>
  );
}
