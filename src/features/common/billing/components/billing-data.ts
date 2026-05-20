export interface Plan {
  name: string;
  price: string;
  period: string;
  description?: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
}

export const currentPlan: Plan = {
  name: 'Professional',
  price: '$99',
  period: '/month',
  features: [
    '10,000 AI queries/month',
    '50 GB document storage',
    '25 team members',
    'Priority support',
    'Advanced analytics',
  ],
};

export const plans: Plan[] = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'For small teams getting started',
    features: [
      '1,000 AI queries/month',
      '5 GB storage',
      '5 team members',
      'Email support',
    ],
    current: false,
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'For growing businesses',
    features: [
      '10,000 AI queries/month',
      '50 GB storage',
      '25 team members',
      'Priority support',
      'Advanced analytics',
    ],
    current: true,
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited AI queries',
      'Unlimited storage',
      'Unlimited team members',
      '24/7 dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    current: false,
  },
];

export const invoices: Invoice[] = [
  { id: 'INV-2026-001', date: 'Feb 1, 2026', amount: '$99.00', status: 'Paid' },
  { id: 'INV-2026-000', date: 'Jan 1, 2026', amount: '$99.00', status: 'Paid' },
  { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: '$99.00', status: 'Paid' },
  { id: 'INV-2025-011', date: 'Nov 1, 2025', amount: '$99.00', status: 'Paid' },
];
