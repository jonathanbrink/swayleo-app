import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '../lib/analytics';
import type { TimeRange } from '../types/analytics';

// ============================================
// Query Keys
// ============================================

export const analyticsKeys = {
  dashboard: (orgId: string) => ['analytics', 'dashboard', orgId] as const,
  brands: (orgId: string) => ['analytics', 'brands', orgId] as const,
  emailTypes: (orgId: string, timeRange: TimeRange) => ['analytics', 'emailTypes', orgId, timeRange] as const,
  activity: (orgId: string, timeRange: TimeRange) => ['analytics', 'activity', orgId, timeRange] as const,
  providers: (orgId: string, timeRange: TimeRange) => ['analytics', 'providers', orgId, timeRange] as const,
  teamActivity: (orgId: string) => ['analytics', 'team', orgId] as const,
};

// ============================================
// Dashboard Stats
// ============================================

export function useDashboardStats(orgId: string) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(orgId),
    queryFn: () => analyticsApi.getDashboardStats(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================
// Brand Stats
// ============================================

export function useBrandStats(orgId: string) {
  return useQuery({
    queryKey: analyticsKeys.brands(orgId),
    queryFn: () => analyticsApi.getBrandStats(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// Email Type Distribution
// ============================================

export function useEmailTypeStats(orgId: string, timeRange: TimeRange = '30d') {
  return useQuery({
    queryKey: analyticsKeys.emailTypes(orgId, timeRange),
    queryFn: () => analyticsApi.getEmailTypeStats(orgId, timeRange),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// Generation Activity Chart
// ============================================

export function useGenerationActivity(orgId: string, timeRange: TimeRange = '30d') {
  return useQuery({
    queryKey: analyticsKeys.activity(orgId, timeRange),
    queryFn: () => analyticsApi.getGenerationActivity(orgId, timeRange),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// Provider Usage
// ============================================

export function useProviderUsage(orgId: string, timeRange: TimeRange = '30d') {
  return useQuery({
    queryKey: analyticsKeys.providers(orgId, timeRange),
    queryFn: () => analyticsApi.getProviderUsage(orgId, timeRange),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================
// Team Activity Feed
// ============================================

export function useTeamActivity(orgId: string, limit: number = 20) {
  return useQuery({
    queryKey: analyticsKeys.teamActivity(orgId),
    queryFn: () => analyticsApi.getTeamActivity(orgId, limit),
    enabled: !!orgId,
    staleTime: 1000 * 60, // 1 minute for activity feed
  });
}
