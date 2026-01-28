import { supabase } from './supabase';
import type { 
  DashboardStats, 
  BrandStats, 
  EmailTypeStats,
  GenerationActivity,
  TeamActivity,
  ProviderUsage,
  TimeRange
} from '../types/analytics';

// ============================================
// Helper to convert time range to days
// ============================================

const timeRangeToDays = (range: TimeRange): number | null => {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case 'all': return null;
  }
};

// ============================================
// Analytics API Functions
// ============================================

export const getDashboardStats = async (orgId: string): Promise<DashboardStats> => {
  const { data, error } = await supabase
    .rpc('get_dashboard_stats', { org_uuid: orgId });

  if (error) throw error;
  return data || {
    totalBrands: 0,
    completedKits: 0,
    totalEmails: 0,
    emailsThisMonth: 0,
    tokensUsed: 0,
    tokensThisMonth: 0,
  };
};

export const getBrandStats = async (orgId: string): Promise<BrandStats[]> => {
  const { data, error } = await supabase
    .rpc('get_brand_stats', { org_uuid: orgId });

  if (error) throw error;
  return data || [];
};

export const getEmailTypeStats = async (
  orgId: string, 
  timeRange: TimeRange = '30d'
): Promise<EmailTypeStats[]> => {
  const days = timeRangeToDays(timeRange);
  const { data, error } = await supabase
    .rpc('get_email_type_stats', { 
      org_uuid: orgId, 
      days_ago: days 
    });

  if (error) throw error;
  return data || [];
};

export const getGenerationActivity = async (
  orgId: string,
  timeRange: TimeRange = '30d'
): Promise<GenerationActivity[]> => {
  const days = timeRangeToDays(timeRange) || 30;
  const { data, error } = await supabase
    .rpc('get_generation_activity', { 
      org_uuid: orgId, 
      days_ago: days 
    });

  if (error) throw error;
  return data || [];
};

export const getProviderUsage = async (
  orgId: string,
  timeRange: TimeRange = '30d'
): Promise<ProviderUsage[]> => {
  const days = timeRangeToDays(timeRange);
  const { data, error } = await supabase
    .rpc('get_provider_usage', { 
      org_uuid: orgId, 
      days_ago: days 
    });

  if (error) throw error;
  return data || [];
};

export const getTeamActivity = async (
  orgId: string,
  limit: number = 20
): Promise<TeamActivity[]> => {
  const { data, error } = await supabase
    .rpc('get_team_activity', { 
      org_uuid: orgId, 
      limit_count: limit 
    });

  if (error) throw error;
  return data || [];
};
