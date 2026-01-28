// ============================================
// Subscription & Billing Types
// ============================================

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'agency';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
}

export interface PlanLimits {
  brands: number;
  emailsPerMonth: number;
  teamMembers: number;
  templates: number;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  advancedAnalytics: boolean;
}

export interface Subscription {
  id: string;
  org_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  emails_generated: number;
  tokens_used: number;
  brands_count: number;
  members_count: number;
  templates_count: number;
}

export interface UsageSummary {
  currentPeriod: {
    emailsGenerated: number;
    tokensUsed: number;
  };
  limits: PlanLimits;
  percentages: {
    emails: number;
    brands: number;
    members: number;
    templates: number;
  };
}

// ============================================
// Subscription Plans
// ============================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic features',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      brands: 1,
      emailsPerMonth: 10,
      teamMembers: 1,
      templates: 3,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      advancedAnalytics: false,
    },
    features: [
      '1 brand',
      '10 emails/month',
      'Basic email templates',
      'HTML export',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting started',
    monthlyPrice: 29,
    yearlyPrice: 290,
    limits: {
      brands: 5,
      emailsPerMonth: 100,
      teamMembers: 3,
      templates: 20,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
      advancedAnalytics: false,
    },
    features: [
      '5 brands',
      '100 emails/month',
      '3 team members',
      '20 custom templates',
      'Klaviyo & Mailchimp export',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing agencies',
    monthlyPrice: 79,
    yearlyPrice: 790,
    highlighted: true,
    limits: {
      brands: 25,
      emailsPerMonth: 500,
      teamMembers: 10,
      templates: 100,
      apiAccess: true,
      prioritySupport: true,
      customBranding: false,
      advancedAnalytics: true,
    },
    features: [
      '25 brands',
      '500 emails/month',
      '10 team members',
      'Unlimited templates',
      'Advanced analytics',
      'Priority support',
      'API access',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For large agencies with custom needs',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    limits: {
      brands: -1, // Unlimited
      emailsPerMonth: -1, // Unlimited
      teamMembers: -1, // Unlimited
      templates: -1, // Unlimited
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
      advancedAnalytics: true,
    },
    features: [
      'Unlimited brands',
      'Unlimited emails',
      'Unlimited team members',
      'Unlimited templates',
      'Custom branding',
      'Dedicated support',
      'API access',
      'SSO (coming soon)',
    ],
  },
];

// Helper to get plan by tier
export const getPlan = (tier: SubscriptionTier): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS.find(p => p.id === tier) || SUBSCRIPTION_PLANS[0];
};

// Helper to check if limit is unlimited
export const isUnlimited = (value: number): boolean => value === -1;

// Helper to format limit display
export const formatLimit = (value: number): string => {
  if (value === -1) return 'Unlimited';
  return value.toLocaleString();
};
