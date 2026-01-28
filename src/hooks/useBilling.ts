import { useQuery, useMutation } from '@tanstack/react-query';
import * as billingApi from '../lib/billing';
import type { SubscriptionTier } from '../types/billing';

// ============================================
// Query Keys
// ============================================

export const billingKeys = {
  subscription: (orgId: string) => ['billing', 'subscription', orgId] as const,
  limits: (orgId: string) => ['billing', 'limits', orgId] as const,
  usage: (orgId: string) => ['billing', 'usage', orgId] as const,
  summary: (orgId: string) => ['billing', 'summary', orgId] as const,
};

// ============================================
// Subscription Hooks
// ============================================

export function useSubscription(orgId: string) {
  return useQuery({
    queryKey: billingKeys.subscription(orgId),
    queryFn: () => billingApi.getSubscription(orgId),
    enabled: !!orgId,
  });
}

export function useOrgLimits(orgId: string) {
  return useQuery({
    queryKey: billingKeys.limits(orgId),
    queryFn: () => billingApi.getOrgLimits(orgId),
    enabled: !!orgId,
  });
}

export function useCurrentUsage(orgId: string) {
  return useQuery({
    queryKey: billingKeys.usage(orgId),
    queryFn: () => billingApi.getCurrentUsage(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useUsageSummary(orgId: string) {
  return useQuery({
    queryKey: billingKeys.summary(orgId),
    queryFn: () => billingApi.getUsageSummary(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60, // 1 minute
  });
}

// ============================================
// Limit Check Hook
// ============================================

export function useCheckLimit(
  orgId: string, 
  resourceType: 'brands' | 'members' | 'templates' | 'emails'
) {
  return useQuery({
    queryKey: [...billingKeys.limits(orgId), resourceType],
    queryFn: () => billingApi.checkLimit(orgId, resourceType),
    enabled: !!orgId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// ============================================
// Checkout Hooks
// ============================================

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: ({ 
      orgId, 
      tier, 
      billingCycle 
    }: { 
      orgId: string; 
      tier: SubscriptionTier; 
      billingCycle: 'monthly' | 'yearly';
    }) => billingApi.createCheckoutSession(orgId, tier, billingCycle),
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: (orgId: string) => billingApi.createPortalSession(orgId),
  });
}
