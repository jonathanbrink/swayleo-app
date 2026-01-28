import { supabase } from './supabase';
import type { 
  Subscription, 
  UsageSummary, 
  SubscriptionTier,
  PlanLimits 
} from '../types/billing';
import { getPlan, isUnlimited } from '../types/billing';

// ============================================
// Subscription API
// ============================================

export const getSubscription = async (orgId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const getOrgLimits = async (orgId: string): Promise<PlanLimits & { tier: SubscriptionTier }> => {
  const { data, error } = await supabase
    .rpc('get_org_limits', { org_uuid: orgId });

  if (error) throw error;
  
  // Return default free limits if none found
  if (!data) {
    const freePlan = getPlan('free');
    return { ...freePlan.limits, tier: 'free' };
  }
  
  return data;
};

export const getCurrentUsage = async (orgId: string): Promise<{
  emailsGenerated: number;
  tokensUsed: number;
  brandsCount: number;
  membersCount: number;
  templatesCount: number;
}> => {
  const { data, error } = await supabase
    .rpc('get_current_usage', { org_uuid: orgId });

  if (error) throw error;
  
  return data || {
    emailsGenerated: 0,
    tokensUsed: 0,
    brandsCount: 0,
    membersCount: 0,
    templatesCount: 0,
  };
};

export const getUsageSummary = async (orgId: string): Promise<UsageSummary> => {
  const [usage, limits] = await Promise.all([
    getCurrentUsage(orgId),
    getOrgLimits(orgId),
  ]);

  const calculatePercentage = (current: number, limit: number): number => {
    if (isUnlimited(limit)) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  return {
    currentPeriod: {
      emailsGenerated: usage.emailsGenerated,
      tokensUsed: usage.tokensUsed,
    },
    limits: {
      brands: limits.brands,
      emailsPerMonth: limits.emailsPerMonth,
      teamMembers: limits.teamMembers,
      templates: limits.templates,
      apiAccess: limits.apiAccess,
      prioritySupport: limits.prioritySupport,
      customBranding: limits.customBranding,
      advancedAnalytics: limits.advancedAnalytics,
    },
    percentages: {
      emails: calculatePercentage(usage.emailsGenerated, limits.emailsPerMonth),
      brands: calculatePercentage(usage.brandsCount, limits.brands),
      members: calculatePercentage(usage.membersCount, limits.teamMembers),
      templates: calculatePercentage(usage.templatesCount, limits.templates),
    },
  };
};

export const checkLimit = async (
  orgId: string, 
  resourceType: 'brands' | 'members' | 'templates' | 'emails'
): Promise<{ allowed: boolean; current: number; limit: number }> => {
  const [usage, limits] = await Promise.all([
    getCurrentUsage(orgId),
    getOrgLimits(orgId),
  ]);

  let current: number;
  let limit: number;

  switch (resourceType) {
    case 'brands':
      current = usage.brandsCount;
      limit = limits.brands;
      break;
    case 'members':
      current = usage.membersCount;
      limit = limits.teamMembers;
      break;
    case 'templates':
      current = usage.templatesCount;
      limit = limits.templates;
      break;
    case 'emails':
      current = usage.emailsGenerated;
      limit = limits.emailsPerMonth;
      break;
  }

  const allowed = isUnlimited(limit) || current < limit;

  return { allowed, current, limit };
};

// ============================================
// Stripe Integration (Placeholder)
// ============================================

// These would typically call a backend endpoint that handles Stripe
export const createCheckoutSession = async (
  orgId: string,
  tier: SubscriptionTier,
  billingCycle: 'monthly' | 'yearly'
): Promise<{ url: string }> => {
  // In production, this would call your backend which creates a Stripe Checkout Session
  // For now, return a placeholder
  console.log('Creating checkout session:', { orgId, tier, billingCycle });
  
  // Placeholder - would return Stripe checkout URL
  return { url: '/settings?upgrade=pending' };
};

export const createPortalSession = async (orgId: string): Promise<{ url: string }> => {
  // In production, this would call your backend which creates a Stripe Customer Portal Session
  console.log('Creating portal session:', { orgId });
  
  // Placeholder - would return Stripe portal URL
  return { url: '/settings?billing=portal' };
};

// ============================================
// Usage Tracking
// ============================================

export const trackEmailGeneration = async (orgId: string): Promise<void> => {
  // This is handled by the generation_logs table triggers
  // This function is a placeholder for any additional tracking
  console.log('Email generation tracked for org:', orgId);
};
