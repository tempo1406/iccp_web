import { Suspense } from 'react';
import { PaymentCancelContent } from './payment-cancel-content';

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PaymentCancelLoading />}>
      <PaymentCancelContent />
    </Suspense>
  );
}

function PaymentCancelLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground text-sm">Processing cancellation...</div>
    </div>
  );
}
