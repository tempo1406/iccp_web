/**
 * src/services/features/billing.service.ts
 */
import { BaseService } from '@/services/base-service';

export interface PlanDto {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}
export interface UsageDto {
  queriesUsed: number;
  queriesLimit: number;
  documentsUsed: number;
  documentsLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
}

export class BillingService extends BaseService {
  private readonly base = '/billing';

  currentPlan(): Promise<PlanDto> {
    return this.get(`${this.base}/plan`);
  }
  usage(): Promise<UsageDto> {
    return this.get(`${this.base}/usage`);
  }

  createCheckoutSession(body: {
    planId: string;
    interval: string;
  }): Promise<{ checkoutUrl: string }> {
    return this.post(`${this.base}/checkout`, body);
  }

  cancelSubscription(): Promise<{ success: boolean; cancelAt: string }> {
    return this.post(`${this.base}/cancel`);
  }
}
