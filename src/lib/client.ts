import { supabase } from './supabase';
import type { 
  ClientAccess, 
  CreateClientAccessInput,
  ClientPortalBrand,
  ClientPortalEmail,
  SubmitApprovalInput,
  EmailApproval
} from '../types/client';

// ============================================
// Client Access Management (for org members)
// ============================================

export const getClientAccess = async (brandId: string): Promise<ClientAccess[]> => {
  const { data, error } = await supabase
    .from('client_access')
    .select(`
      *,
      brand:brands(id, name, org_id)
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createClientAccess = async (
  input: CreateClientAccessInput
): Promise<ClientAccess> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const expiresAt = input.expires_in_days 
    ? new Date(Date.now() + input.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('client_access')
    .insert({
      brand_id: input.brand_id,
      email: input.email,
      name: input.name || null,
      access_level: input.access_level || 'view',
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select(`
      *,
      brand:brands(id, name, org_id)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateClientAccess = async (
  id: string,
  updates: { name?: string; access_level?: string; expires_at?: string | null }
): Promise<ClientAccess> => {
  const { data, error } = await supabase
    .from('client_access')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      brand:brands(id, name, org_id)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteClientAccess = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('client_access')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const regenerateClientToken = async (id: string): Promise<ClientAccess> => {
  // Generate new token via update (DB will generate new token)
  const { data, error } = await supabase
    .rpc('regenerate_client_token', { access_id: id });

  if (error) {
    // Fallback: manual token generation
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const { data: updated, error: updateError } = await supabase
      .from('client_access')
      .update({ token })
      .eq('id', id)
      .select(`
        *,
        brand:brands(id, name, org_id)
      `)
      .single();
    
    if (updateError) throw updateError;
    return updated;
  }
  
  return data;
};

// ============================================
// Email Approvals (for org members to view)
// ============================================

export const getEmailApprovals = async (savedEmailId: string): Promise<EmailApproval[]> => {
  const { data, error } = await supabase
    .from('email_approvals')
    .select(`
      *,
      client:client_access(name, email)
    `)
    .eq('saved_email_id', savedEmailId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const requestApproval = async (
  savedEmailId: string,
  clientAccessIds: string[]
): Promise<void> => {
  // Create pending approvals for selected clients
  const approvals = clientAccessIds.map(clientId => ({
    saved_email_id: savedEmailId,
    client_access_id: clientId,
    status: 'pending',
  }));

  const { error } = await supabase
    .from('email_approvals')
    .upsert(approvals, { onConflict: 'saved_email_id,client_access_id' });

  if (error) throw error;

  // Update email status to pending
  await supabase
    .from('saved_emails')
    .update({ approval_status: 'pending', status: 'pending_approval' })
    .eq('id', savedEmailId);
};

// ============================================
// Client Portal Functions (for clients via token)
// ============================================

export const validateClientToken = async (token: string): Promise<{
  id: string;
  brand_id: string;
  brand_name: string;
  email: string;
  name: string | null;
  access_level: string;
} | null> => {
  const { data, error } = await supabase
    .rpc('validate_client_token', { access_token: token });

  if (error) throw error;
  return data;
};

export const getClientBrand = async (token: string): Promise<ClientPortalBrand | null> => {
  const { data, error } = await supabase
    .rpc('get_client_brand', { access_token: token });

  if (error) throw error;
  return data;
};

export const getClientEmails = async (token: string): Promise<ClientPortalEmail[]> => {
  const { data, error } = await supabase
    .rpc('get_client_emails', { access_token: token });

  if (error) throw error;
  return data || [];
};

export const submitApproval = async (
  token: string,
  emailId: string,
  input: SubmitApprovalInput
): Promise<EmailApproval> => {
  const { data, error } = await supabase
    .rpc('submit_email_approval', {
      access_token: token,
      email_id: emailId,
      approval_status: input.status,
      approval_feedback: input.feedback || null,
    });

  if (error) throw error;
  return data;
};

// ============================================
// Helpers
// ============================================

export const getClientPortalUrl = (token: string): string => {
  return `${window.location.origin}/client/${token}`;
};
