// ============================================
// Email Template Library Types
// ============================================

import type { EmailType } from './email';

export interface CustomTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  email_type: EmailType;
  
  // Template configuration
  tone: 'default' | 'more_casual' | 'more_formal' | 'more_urgent' | 'more_playful';
  max_length: 'short' | 'medium' | 'long';
  include_emoji: boolean;
  subject_line_count: number;
  variation_count: number;
  
  // Custom prompt additions
  custom_instructions: string | null;
  example_subject_lines: string[] | null;
  example_cta: string | null;
  
  // Metadata
  is_shared: boolean;
  use_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  creator?: {
    full_name: string | null;
  };
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  email_type: EmailType;
  tone?: CustomTemplate['tone'];
  max_length?: CustomTemplate['max_length'];
  include_emoji?: boolean;
  subject_line_count?: number;
  variation_count?: number;
  custom_instructions?: string;
  example_subject_lines?: string[];
  example_cta?: string;
  is_shared?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  tone?: CustomTemplate['tone'];
  max_length?: CustomTemplate['max_length'];
  include_emoji?: boolean;
  subject_line_count?: number;
  variation_count?: number;
  custom_instructions?: string;
  example_subject_lines?: string[];
  example_cta?: string;
  is_shared?: boolean;
}

// Template categories for organization
export const TEMPLATE_CATEGORIES = [
  { id: 'my_templates', name: 'My Templates', icon: '📝' },
  { id: 'shared', name: 'Shared Templates', icon: '👥' },
  { id: 'popular', name: 'Most Used', icon: '⭐' },
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]['id'];
