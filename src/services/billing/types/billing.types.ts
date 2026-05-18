export interface BillingPlanFeatures {
  [key: string]: boolean;
}

export interface BillingPlanDto {
  id: string;
  name: string;
  code: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  maxUsers: number;
  maxDocuments: number;
  maxStorageGb: number;
  maxProjects: number;
  features: BillingPlanFeatures;
  trialDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'yearly';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'pending_payment';

export interface OrganizationSummaryDto {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface SubscriptionDto {
  id: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: BillingPlanDto;
  organization: OrganizationSummaryDto;
}

// ── Invoice ───────────────────────────────────────────────────────────────────

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
  orderCode?: number | null;
  checkoutUrl?: string | null;
  transactionId?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InvoicePaginationDto {
  data: InvoiceDto[];
  meta: PaginationMeta;
}

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  sortBy?: 'createdAt' | 'issueDate' | 'dueDate' | 'amount' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

// ── Payment ───────────────────────────────────────────────────────────────────

export type PaymentLinkStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

/** organizationId removed — now sent via x-organization-id header */
export interface CreatePaymentLinkBody {
  planId: string;
  billingCycle: BillingCycle;
}

export interface ChangePlanBody {
  planId: string;
  billingCycle: BillingCycle;
}

export interface CreatePaymentLinkDto {
  checkoutUrl: string;
  orderCode: number;
  amount: number;
  transactionId: string;
}

export interface PaymentTransactionDto {
  reference: string;
  amount: number;
  accountNumber: string;
  description: string;
  transactionDateTime: string;
}

export interface PaymentStatusDto {
  orderCode: number;
  status: PaymentLinkStatus;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  createdAt: string;
  transactions: PaymentTransactionDto[];
}

