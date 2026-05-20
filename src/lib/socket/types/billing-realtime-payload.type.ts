export interface BillingPaymentSuccessPayload {
  orgId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'success';
  transactionId: string;
}

export interface BillingPaymentFailedPayload {
  orgId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'failed';
}

export interface BillingSubscriptionUpdatedPayload {
  orgId: string;
  planName: string;
  expiresAt: string;
}

export interface BillingSubscriptionRenewalReminderPayload {
  orgId: string;
  planName: string;
  expiresAt: string;
  daysRemaining: number;
}
