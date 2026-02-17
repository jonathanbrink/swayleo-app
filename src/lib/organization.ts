import { supabase } from './supabase';
import type { 
  Organization, 
  OrganizationMember, 
  Invitation,
  UpdateOrganizationInput,
  InviteMemberInput 
} from '../types/organization';

// ============================================
// Organization API
// ============================================

export const getCurrentOrganization = async (): Promise<Organization | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('getCurrentOrganization: No user');
    return null;
  }

  console.log('getCurrentOrganization: User ID:', user.id);

  // Get user's primary org through members table
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (memberError) {
    console.log('getCurrentOrganization: Member query error:', memberError);
  }

  if (!membership) {
    console.log('getCurrentOrganization: No membership found');
    return null;
  }

  console.log('getCurrentOrganization: Found org_id:', membership.org_id);

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', membership.org_id)
    .single();

  if (error) {
    console.log('getCurrentOrganization: Org query error:', error);
    throw error;
  }
  
  console.log('getCurrentOrganization: Found org:', data?.name);
  return data;
};

export const getOrganization = async (id: string): Promise<Organization | null> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const createOrganization = async (name: string): Promise<Organization> => {
  const { data, error } = await supabase
    .rpc('create_organization', { org_name: name });

  if (error) throw error;
  return data;
};

export const updateOrganization = async (
  id: string, 
  input: UpdateOrganizationInput
): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserOrganizations = async (): Promise<Organization[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', user.id);

  if (!memberships?.length) return [];

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .in('id', memberships.map(m => m.org_id))
    .order('name');

  if (error) throw error;
  return data || [];
};

// ============================================
// Members API
// ============================================

export const getOrganizationMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  // Get members first
  const { data: members, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  if (!members?.length) return [];

  // Get profiles for these members (includes email column)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', members.map(m => m.user_id));

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Get current user for their email (fallback)
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  return members.map(member => {
    const profile = profileMap.get(member.user_id);
    return {
      ...member,
      user: {
        id: member.user_id,
        full_name: profile?.full_name || null,
        email: profile?.email || (member.user_id === currentUser?.id ? currentUser?.email ?? null : null),
      }
    };
  });
};

export const updateMemberRole = async (
  memberId: string,
  role: 'admin' | 'member'
): Promise<OrganizationMember> => {
  const { data, error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeMember = async (memberId: string): Promise<void> => {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
};

export const transferOwnership = async (orgId: string, newOwnerId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current owner's membership
  const { data: currentOwnerMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .single();

  if (!currentOwnerMember) throw new Error('Only the owner can transfer ownership');

  // Get new owner's membership
  const { data: newOwnerMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', newOwnerId)
    .single();

  if (!newOwnerMember) throw new Error('User is not a member of this organization');

  // Demote current owner to admin
  const { error: demoteError } = await supabase
    .from('organization_members')
    .update({ role: 'admin' })
    .eq('id', currentOwnerMember.id);

  if (demoteError) throw demoteError;

  // Promote new owner
  const { error: promoteError } = await supabase
    .from('organization_members')
    .update({ role: 'owner' })
    .eq('id', newOwnerMember.id);

  if (promoteError) throw promoteError;
};

export const getCurrentUserRole = async (orgId: string): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  return data?.role || null;
};

// ============================================
// Invitations API
// ============================================

export const getInvitations = async (orgId: string): Promise<Invitation[]> => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createInvitation = async (
  orgId: string,
  input: InviteMemberInput
): Promise<Invitation> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get inviter's name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Get org name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  // Delete any existing invitations for this email in this org
  await supabase
    .from('invitations')
    .delete()
    .eq('org_id', orgId)
    .eq('email', input.email.toLowerCase());

  // Check if user is already a member (by checking profiles with this email)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', input.email.toLowerCase())
    .single();

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', existingProfile.id)
      .single();

    if (existingMember) {
      throw new Error('This user is already a member of the organization');
    }
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      org_id: orgId,
      email: input.email.toLowerCase(),
      role: input.role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('This email has already been invited');
    }
    throw error;
  }

  // Send invite email via edge function
  try {
    const inviteUrl = `${window.location.origin}/invite/${data.token}`;
    
    await supabase.functions.invoke('send-invite-email', {
      body: {
        to: input.email.toLowerCase(),
        inviterName: profile?.full_name || user.email || 'Someone',
        orgName: org?.name || 'an organization',
        role: input.role,
        inviteUrl,
      },
    });
  } catch (emailError) {
    console.error('Failed to send invite email:', emailError);
    // Don't fail the invitation if email fails - they can still copy the link
  }

  return data;
};

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
};

export const resendInvitation = async (invitation: Invitation): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get inviter's name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Get org name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', invitation.org_id)
    .single();

  const inviteUrl = `${window.location.origin}/invite/${invitation.token}`;
  
  const { error } = await supabase.functions.invoke('send-invite-email', {
    body: {
      to: invitation.email,
      inviterName: profile?.full_name || user.email || 'Someone',
      orgName: org?.name || 'an organization',
      role: invitation.role,
      inviteUrl,
    },
  });

  if (error) throw error;
};

export const getInvitationByToken = async (token: string): Promise<Invitation | null> => {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organization:organizations(name)
    `)
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const acceptInvitation = async (token: string): Promise<OrganizationMember> => {
  const { data, error } = await supabase
    .rpc('accept_invitation', { invite_token: token });

  if (error) throw error;
  return data;
};

// ============================================
// Onboarding Helpers
// ============================================

export const checkOnboardingStatus = async (orgId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if user has org
  const hasOrg = !!orgId;

  // Check if org has brands
  const { count: brandCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  // Check if any brand kit is complete
  const { data: completeKits } = await supabase
    .from('brand_kits')
    .select('brand_id')
    .eq('is_complete', true)
    .in('brand_id', 
      (await supabase.from('brands').select('id').eq('org_id', orgId)).data?.map(b => b.id) || []
    );

  // Check if any emails generated
  const { count: emailCount } = await supabase
    .from('saved_emails')
    .select('*', { count: 'exact', head: true })
    .in('brand_id',
      (await supabase.from('brands').select('id').eq('org_id', orgId)).data?.map(b => b.id) || []
    );

  return {
    hasOrg,
    hasBrand: (brandCount || 0) > 0,
    hasCompleteKit: (completeKits?.length || 0) > 0,
    hasGeneratedEmail: (emailCount || 0) > 0,
  };
};
