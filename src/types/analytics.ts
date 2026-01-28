// ============================================
// Analytics Types
// ============================================

export interface DashboardStats {
  totalBrands: number;
  completedKits: number;
  totalEmails: number;
  emailsThisMonth: number;
  tokensUsed: number;
  tokensThisMonth: number;
}

export interface BrandStats {
  id: string;
  name: string;
  kitProgress: number;
  emailCount: number;
  lastActivity: string | null;
}

export interface EmailTypeStats {
  emailType: string;
  count: number;
  percentage: number;
}

export interface GenerationActivity {
  date: string;
  count: number;
  tokens: number;
}

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityName: string | null;
  createdAt: string;
}

export interface ProviderUsage {
  provider: string;
  count: number;
  tokens: number;
  estimatedCost: number;
}

// Time range for analytics queries
export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsFilters {
  timeRange: TimeRange;
  brandId?: string;
}
