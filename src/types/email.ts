// ============================================
// Email Types & Templates
// ============================================

export type EmailType = 
  | 'welcome'
  | 'welcome_series_2'
  | 'welcome_series_3'
  | 'abandoned_cart'
  | 'abandoned_browse'
  | 'post_purchase'
  | 'review_request'
  | 'winback'
  | 'promotion'
  | 'new_product'
  | 'back_in_stock'
  | 'vip_exclusive';

export interface EmailTemplate {
  id: EmailType;
  name: string;
  description: string;
  category: 'welcome' | 'abandonment' | 'post_purchase' | 'promotional' | 'retention';
  icon: string;
  defaultSubjectLines: number;
  defaultVariations: number;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Welcome Series
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'First email after signup. Introduce the brand and set expectations.',
    category: 'welcome',
    icon: '👋',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  {
    id: 'welcome_series_2',
    name: 'Welcome Series #2',
    description: 'Follow-up email. Share brand story or bestsellers.',
    category: 'welcome',
    icon: '📖',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  {
    id: 'welcome_series_3',
    name: 'Welcome Series #3',
    description: 'Third touchpoint. Social proof or incentive reminder.',
    category: 'welcome',
    icon: '⭐',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  // Abandonment
  {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    description: 'Recover lost sales with a reminder about items left behind.',
    category: 'abandonment',
    icon: '🛒',
    defaultSubjectLines: 5,
    defaultVariations: 3,
  },
  {
    id: 'abandoned_browse',
    name: 'Browse Abandonment',
    description: 'Re-engage visitors who browsed but didn\'t add to cart.',
    category: 'abandonment',
    icon: '👀',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  // Post-Purchase
  {
    id: 'post_purchase',
    name: 'Post-Purchase Thank You',
    description: 'Confirm order and build excitement for delivery.',
    category: 'post_purchase',
    icon: '🎉',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  {
    id: 'review_request',
    name: 'Review Request',
    description: 'Ask for a review after product delivery.',
    category: 'post_purchase',
    icon: '✍️',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  // Promotional
  {
    id: 'promotion',
    name: 'Sale / Promotion',
    description: 'Announce a sale, discount, or limited-time offer.',
    category: 'promotional',
    icon: '🏷️',
    defaultSubjectLines: 5,
    defaultVariations: 3,
  },
  {
    id: 'new_product',
    name: 'New Product Launch',
    description: 'Introduce a new product or collection.',
    category: 'promotional',
    icon: '✨',
    defaultSubjectLines: 4,
    defaultVariations: 2,
  },
  {
    id: 'back_in_stock',
    name: 'Back in Stock',
    description: 'Notify customers that a popular item has returned.',
    category: 'promotional',
    icon: '🔔',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
  // Retention
  {
    id: 'winback',
    name: 'Winback',
    description: 'Re-engage lapsed customers who haven\'t purchased recently.',
    category: 'retention',
    icon: '💌',
    defaultSubjectLines: 4,
    defaultVariations: 3,
  },
  {
    id: 'vip_exclusive',
    name: 'VIP Exclusive',
    description: 'Special offer or early access for top customers.',
    category: 'retention',
    icon: '👑',
    defaultSubjectLines: 3,
    defaultVariations: 2,
  },
];

export const EMAIL_CATEGORIES = [
  { id: 'welcome', name: 'Welcome Series', icon: '👋' },
  { id: 'abandonment', name: 'Abandonment', icon: '🛒' },
  { id: 'post_purchase', name: 'Post-Purchase', icon: '📦' },
  { id: 'promotional', name: 'Promotional', icon: '🏷️' },
  { id: 'retention', name: 'Retention', icon: '💌' },
] as const;

// ============================================
// Generation Request/Response
// ============================================

export interface EmailGenerationRequest {
  brandId: string;
  emailType: EmailType;
  subjectLineCount: number;
  variationCount: number;
  additionalContext?: string;
  tone?: 'default' | 'more_casual' | 'more_formal' | 'more_urgent' | 'more_playful';
  includeEmoji?: boolean;
  maxLength?: 'short' | 'medium' | 'long';
}

export interface GeneratedSubjectLine {
  text: string;
  previewText?: string;
}

export interface GeneratedEmailVariation {
  id: string;
  headline?: string;
  subheader1?: string;
  cta1?: string;
  subheader2?: string;
  body: string;
  cta: string;  // Keep for backward compatibility
  cta2?: string;
  ctaUrl?: string;
}

export interface GeneratedEmail {
  id: string;
  brandId: string;
  emailType: EmailType;
  subjectLines: GeneratedSubjectLine[];
  variations: GeneratedEmailVariation[];
  generatedAt: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

// ============================================
// Saved Emails (Database)
// ============================================

export interface SavedEmail {
  id: string;
  brand_id: string;
  email_type: EmailType;
  name: string;
  subject_line: string;
  preview_text: string | null;
  body_content: string;
  cta_text: string;
  status: 'draft' | 'approved' | 'exported';
  created_at: string;
  updated_at: string;
}

// ============================================
// LLM Provider Config
// ============================================

export type LLMProvider = 'anthropic' | 'openai' | 'deepseek';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  displayName: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export const LLM_CONFIGS: Record<LLMProvider, LLMConfig> = {
  anthropic: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
  },
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    displayName: 'DeepSeek',
    costPer1kInput: 0.00014,
    costPer1kOutput: 0.00028,
  },
};
