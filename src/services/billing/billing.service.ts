import { BaseService } from '@/services/base-service';
import type {
  BillingPlanDto,
  ChangePlanBody,
  CreatePaymentLinkBody,
  CreatePaymentLinkDto,
  InvoicePaginationDto,
  InvoiceQueryParams,
  PaymentStatusDto,
  SubscriptionDto,
} from './types/billing.types';

export class BillingService extends BaseService {
  private readonly base = '/v1/billing';
  private readonly paymentBase = '/v1/payment';

  /** GET /api/v1/billing/plans — public */
  getPlans(): Promise<BillingPlanDto[]> {
    return this.get<BillingPlanDto[]>(`${this.base}/plans`);
  }

  /** GET /api/v1/billing/my-subscription */
  getMySubscription(): Promise<SubscriptionDto | null> {
    return this.get<SubscriptionDto | null>(`${this.base}/my-subscription`);
  }

  /** GET /api/v1/billing/my-invoices */
  getMyInvoices(params?: InvoiceQueryParams): Promise<InvoicePaginationDto> {
    const query = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)]),
          ),
        ).toString()
      : '';
    return this.get<InvoicePaginationDto>(`${this.base}/my-invoices${query}`);
  }

  /** POST /api/v1/billing/my-subscription/cancel */
  cancelMySubscription(): Promise<void> {
    return this.post<void>(`${this.base}/my-subscription/cancel`);
  }

  /** POST /api/v1/payment/create-payment-link */
  createPaymentLink(body: CreatePaymentLinkBody): Promise<CreatePaymentLinkDto> {
    return this.post<CreatePaymentLinkDto, CreatePaymentLinkBody>(
      `${this.paymentBase}/create-payment-link`,
      body,
    );
  }

  /** POST /api/v1/payment/change-plan — auto-cancels current subscription */
  changePlan(body: ChangePlanBody): Promise<CreatePaymentLinkDto> {
    return this.post<CreatePaymentLinkDto, ChangePlanBody>(
      `${this.paymentBase}/change-plan`,
      body,
    );
  }

  /** POST /api/v1/payment/confirm/:orderCode — sync DB, call after PayOS redirect */
  confirmPayment(orderCode: number): Promise<PaymentStatusDto> {
    return this.post<PaymentStatusDto>(`${this.paymentBase}/confirm/${orderCode}`);
  }

  /** GET /api/v1/payment/status/:orderCode — read-only, no DB side effects */
  getPaymentStatus(orderCode: number): Promise<PaymentStatusDto> {
    return this.get<PaymentStatusDto>(`${this.paymentBase}/status/${orderCode}`);
  }

  /** POST /api/v1/payment/cancel/:orderCode — only works when status is PENDING */
  cancelPayment(orderCode: number): Promise<void> {
    return this.post<void>(`${this.paymentBase}/cancel/${orderCode}`);
  }
}
