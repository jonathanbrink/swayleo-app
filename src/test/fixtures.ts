import type { Brand, BrandKit } from '../types';
import type { EmailGenerationRequest } from '../types/email';

export const mockBrand: Brand = {
  id: 'brand-123',
  org_id: 'org-456',
  name: 'TestBrand Co',
  website_url: 'https://testbrand.com',
  vertical: 'skincare',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

export const mockBrandNoWebsite: Brand = {
  ...mockBrand,
  id: 'brand-789',
  website_url: null,
  vertical: null,
};

export const mockBrandKit: BrandKit = {
  brand_id: 'brand-123',
  brand_identity: {
    values_themes: 'Clean beauty, sustainability',
    brand_story: 'Founded in 2020 by a dermatologist',
    desired_feeling: 'Confident, radiant, natural',
    cultural_influences: 'Japanese skincare rituals',
  },
  product_differentiation: {
    unique_aspects: 'All-natural ingredients, dermatologist-tested',
    best_sellers: 'Vitamin C Serum, Hyaluronic Moisturizer',
    features_to_emphasize: 'Cruelty-free, vegan, sustainable packaging',
  },
  customer_audience: {
    ideal_customer: 'Women 25-45 who care about ingredients',
    day_to_day: 'Busy professionals who want simple but effective routines',
    brands_they_buy: 'Glossier, The Ordinary, Drunk Elephant',
  },
  brand_voice: {
    voice_description: 'Warm, knowledgeable, like a trusted friend',
    words_to_avoid: 'Anti-aging, flawless, perfect',
    reference_brands: 'Glossier for warmth, Drunk Elephant for expertise',
  },
  marketing_strategy: {
    competitors: 'The Ordinary, CeraVe, Glossier',
    planned_launches: 'SPF line in Q2',
    has_review_platform: true,
    review_platform: 'Yotpo',
    welcome_incentives: '15% off first order',
    international_shipping: true,
    return_policy: '30-day hassle-free returns',
  },
  design_preferences: {
    brands_liked_visually: 'Aesop, Le Labo',
    design_elements: 'Minimal, earthy tones, clean typography',
    moodboard_link: '',
  },
  is_complete: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

export const mockEmptyBrandKit: BrandKit = {
  brand_id: 'brand-789',
  brand_identity: {
    values_themes: '',
    brand_story: '',
    desired_feeling: '',
    cultural_influences: '',
  },
  product_differentiation: {
    unique_aspects: '',
    best_sellers: '',
    features_to_emphasize: '',
  },
  customer_audience: {
    ideal_customer: '',
    day_to_day: '',
    brands_they_buy: '',
  },
  brand_voice: {
    voice_description: '',
    words_to_avoid: '',
    reference_brands: '',
  },
  marketing_strategy: {
    competitors: '',
    planned_launches: '',
    has_review_platform: false,
    review_platform: '',
    welcome_incentives: '',
    international_shipping: false,
    return_policy: '',
  },
  design_preferences: {
    brands_liked_visually: '',
    design_elements: '',
    moodboard_link: '',
  },
  is_complete: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

export const mockEmailRequest: EmailGenerationRequest = {
  brandId: 'brand-123',
  emailType: 'welcome',
  subjectLineCount: 3,
  variationCount: 2,
  tone: 'default',
  includeEmoji: true,
  maxLength: 'medium',
};

export const mockEmailRequestCasual: EmailGenerationRequest = {
  ...mockEmailRequest,
  tone: 'more_casual',
  additionalContext: 'Focus on the summer collection launch',
};

export const mockEmailRequestNoEmoji: EmailGenerationRequest = {
  ...mockEmailRequest,
  includeEmoji: false,
  maxLength: 'short',
};
