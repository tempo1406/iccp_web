'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/providers/socket-provider';
import { SOCKET_NAMESPACES, SOCKET_EVENTS } from '@/common/constant/socket.constant';
import { toast } from '@/lib/toast';
import type {
  BillingPaymentSuccessPayload,
  BillingPaymentFailedPayload,
  BillingSubscriptionUpdatedPayload,
  BillingSubscriptionRenewalReminderPayload,
} from '@/lib/socket/events';

export function BillingRealtimeBridge() {
  const qc = useQueryClient();

  const invalidateBilling = () => {
    void qc.invalidateQueries({ queryKey: ['billing', 'plans'] });
    void qc.invalidateQueries({ queryKey: ['billing', 'my-subscription'] });
    void qc.invalidateQueries({ queryKey: ['billing', 'my-invoices'] });
  };

  useSocketEvent(
    SOCKET_NAMESPACES.BILLING,
    SOCKET_EVENTS.BILLING_PAYMENT_SUCCESS,
    (payload: BillingPaymentSuccessPayload) => {
      toast.success(
        `Payment for ${payload.planName} successful!`,
        `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: payload.currency }).format(payload.amount)}`,
      );
      invalidateBilling();
    },
  );

  useSocketEvent(
    SOCKET_NAMESPACES.BILLING,
    SOCKET_EVENTS.BILLING_PAYMENT_FAILED,
    (payload: BillingPaymentFailedPayload) => {
      toast.danger(`Payment for ${payload.planName} failed.`);
    },
  );

  useSocketEvent(
    SOCKET_NAMESPACES.BILLING,
    SOCKET_EVENTS.BILLING_SUBSCRIPTION_UPDATED,
    (payload: BillingSubscriptionUpdatedPayload) => {
      invalidateBilling();
      toast.success(`Subscription updated to ${payload.planName}.`);
    },
  );

  useSocketEvent(
    SOCKET_NAMESPACES.BILLING,
    SOCKET_EVENTS.BILLING_SUBSCRIPTION_RENEWAL_REMINDER,
    (payload: BillingSubscriptionRenewalReminderPayload) => {
      toast.warning(
        `${payload.planName} expires in ${payload.daysRemaining} days. Please renew!`,
      );
    },
  );

  return null;
}
