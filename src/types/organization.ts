// ============================================
// Organization Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  // Joined from profiles
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: 'admin' | 'member';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  // Joined
  inviter?: {
    full_name: string | null;
  };
  organization?: {
    name: string;
  };
}

// ============================================
// Onboarding Types
// ============================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'create_org',
    title: 'Create your organization',
    description: 'Set up your agency workspace',
    completed: false,
  },
  {
    id: 'first_brand',
    title: 'Add your first brand',
    description: 'Create a brand to manage',
    completed: false,
  },
  {
    id: 'complete_kit',
    title: 'Complete a Brand Kit',
    description: 'Fill out the brand questionnaire',
    completed: false,
  },
  {
    id: 'generate_email',
    title: 'Generate your first email',
    description: 'Use AI to create email copy',
    completed: false,
  },
];

// ============================================
// Settings Types
// ============================================

export interface OrganizationSettings {
  default_llm_provider: 'anthropic' | 'openai' | 'deepseek';
  email_footer_text: string | null;
  brand_limit: number;
  member_limit: number;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  logo_url?: string | null;
}

export interface InviteMemberInput {
  email: string;
  role: 'admin' | 'member';
}
