// ============================================
// Database Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  full_name: string | null;
  role: 'account_manager' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  org_id: string;
  name: string;
  website_url: string | null;
  vertical: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandIdentity {
  values_themes: string;
  brand_story: string;
  desired_feeling: string;
  cultural_influences: string;
}

export interface ProductDifferentiation {
  unique_aspects: string;
  best_sellers: string;
  features_to_emphasize: string;
}

export interface CustomerAudience {
  ideal_customer: string;
  day_to_day: string;
  brands_they_buy: string;
}

export interface BrandVoice {
  voice_description: string;
  words_to_avoid: string;
  reference_brands: string;
}

export interface MarketingStrategy {
  competitors: string;
  planned_launches: string;
  has_review_platform: boolean;
  review_platform: string;
  welcome_incentives: string;
  international_shipping: boolean;
  return_policy: string;
}

export interface DesignPreferences {
  brands_liked_visually: string;
  design_elements: string;
  moodboard_link: string;
}

export interface BrandKit {
  brand_id: string;
  brand_identity: BrandIdentity;
  product_differentiation: ProductDifferentiation;
  customer_audience: CustomerAudience;
  brand_voice: BrandVoice;
  marketing_strategy: MarketingStrategy;
  design_preferences: DesignPreferences;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoodboardAsset {
  id: string;
  brand_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number | null;
  uploaded_at: string;
  url?: string;
}

// ============================================
// API Types
// ============================================

export interface CreateBrandInput {
  name: string;
  website_url?: string | null;
  vertical?: string | null;
}

export interface UpdateBrandInput {
  name?: string;
  website_url?: string | null;
  vertical?: string | null;
}

export interface UpdateBrandKitInput {
  brand_identity?: Partial<BrandIdentity>;
  product_differentiation?: Partial<ProductDifferentiation>;
  customer_audience?: Partial<CustomerAudience>;
  brand_voice?: Partial<BrandVoice>;
  marketing_strategy?: Partial<MarketingStrategy>;
  design_preferences?: Partial<DesignPreferences>;
  is_complete?: boolean;
}

// ============================================
// UI Types
// ============================================

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface BrandWithKit extends Brand {
  brand_kit: BrandKit | null;
}

// ============================================
// Form Section Types
// ============================================

export const BRAND_KIT_SECTIONS = [
  { id: 'identity', title: 'Brand Identity & Positioning', icon: 'Sparkles' },
  { id: 'product', title: 'Product & Differentiation', icon: 'Diamond' },
  { id: 'customer', title: 'Customer & Audience', icon: 'Target' },
  { id: 'voice', title: 'Brand Voice & Creative', icon: 'MessageSquare' },
  { id: 'marketing', title: 'Marketing & Strategy', icon: 'TrendingUp' },
  { id: 'design', title: 'Design & Moodboard', icon: 'Palette' },
] as const;

export type BrandKitSectionId = typeof BRAND_KIT_SECTIONS[number]['id'];

// ============================================
// Vertical Options
// ============================================

export const VERTICAL_OPTIONS = [
  { value: 'apparel', label: 'Apparel & Fashion' },
  { value: 'supplements', label: 'Supplements & Vitamins' },
  { value: 'skincare', label: 'Skincare & Beauty' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'home', label: 'Home & Living' },
  { value: 'tech', label: 'Technology' },
  { value: 'fitness', label: 'Fitness & Wellness' },
  { value: 'other', label: 'Other' },
] as const;

// Re-export email types
export * from './email';

// Re-export organization types
export * from './organization';

// Re-export analytics types
export * from './analytics';

// Re-export template types
export * from './template';

// Re-export billing types
export * from './billing';

// Re-export client types
export * from './client';
