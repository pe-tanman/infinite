export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  documentLimit: number | null; // null means unlimited
  priority: number;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUsage {
  userId: string;
  documentsCreated: number;
  documentsThisMonth: number;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Up to 15 documents',
    ],
    documentLimit: 15,
    priority: 0
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 4.99,
    interval: 'month',
    features: [
      'Unlimited documents',
    ],
    documentLimit: null,
    priority: 2
  },
];
