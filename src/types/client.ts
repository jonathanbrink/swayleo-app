// ============================================
// Client Portal Types
// ============================================

export type ClientAccessLevel = 'view' | 'review' | 'approve';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export interface ClientAccess {
  id: string;
  brand_id: string;
  email: string;
  name: string | null;
  access_level: ClientAccessLevel;
  token: string;
  expires_at: string | null; // null = never expires
  last_accessed_at: string | null;
  created_by: string;
  created_at: string;
  
  // Joined data
  brand?: {
    id: string;
    name: string;
    org_id: string;
  };
}

export interface EmailApproval {
  id: string;
  saved_email_id: string;
  client_access_id: string;
  status: ApprovalStatus;
  feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  client?: {
    name: string | null;
    email: string;
  };
}

export interface ClientPortalBrand {
  id: string;
  name: string;
  website_url: string | null;
  vertical: string | null;
  brand_kit: {
    brand_identity: {
      values_themes: string;
      brand_story: string;
    };
    brand_voice: {
      voice_description: string;
    };
    is_complete: boolean;
  } | null;
}

export interface ClientPortalEmail {
  id: string;
  name: string;
  email_type: string;
  subject_line: string;
  preview_text: string | null;
  body_content: string;
  cta_text: string | null;
  status: string;
  created_at: string;
  approval?: EmailApproval | null;
}

export interface CreateClientAccessInput {
  brand_id: string;
  email: string;
  name?: string;
  access_level?: ClientAccessLevel;
  expires_in_days?: number | null; // null = never expires
}

export interface SubmitApprovalInput {
  status: 'approved' | 'rejected' | 'revision_requested';
  feedback?: string;
}

// Access level descriptions
export const ACCESS_LEVELS: { id: ClientAccessLevel; name: string; description: string }[] = [
  { 
    id: 'view', 
    name: 'View Only', 
    description: 'Can view brand details and generated emails' 
  },
  { 
    id: 'review', 
    name: 'Review', 
    description: 'Can view and leave comments on emails' 
  },
  { 
    id: 'approve', 
    name: 'Approve', 
    description: 'Can approve, reject, or request revisions on emails' 
  },
];

// Approval status display
export const APPROVAL_STATUSES: { id: ApprovalStatus; name: string; color: string }[] = [
  { id: 'pending', name: 'Pending Review', color: 'amber' },
  { id: 'approved', name: 'Approved', color: 'emerald' },
  { id: 'rejected', name: 'Rejected', color: 'red' },
  { id: 'revision_requested', name: 'Revision Requested', color: 'blue' },
];

export const getApprovalStatus = (status: ApprovalStatus) => {
  return APPROVAL_STATUSES.find(s => s.id === status) || APPROVAL_STATUSES[0];
};
