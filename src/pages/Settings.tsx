import { useState, useEffect } from 'react';
import { 
  Building2, Users, Mail, Shield, Crown,
  Copy, Check, Trash2, Plus, Clock, CreditCard, Zap, Sparkles, Key, Eye, EyeOff, User, Camera, Send
} from 'lucide-react';
import { Button, Input, Modal, Select, useToast } from '../components/ui';
import { UsageBar, UpgradeModal } from '../components/billing';
import { 
  useCurrentOrganization, 
  useUpdateOrganization,
  useOrganizationMembers,
  useCurrentUserRole,
  useInvitations,
  useCreateInvitation,
  useDeleteInvitation,
  useResendInvitation,
  useUpdateMemberRole,
  useRemoveMember,
  useTransferOwnership,
  useAuth,
  useSubscription,
  useUsageSummary,
  useCreatePortalSession
} from '../hooks';
import { supabase } from '../lib/supabase';
import { getPlan, SUBSCRIPTION_PLANS } from '../types/billing';
import type { OrganizationMember, Invitation } from '../types/organization';

type Tab = 'profile' | 'general' | 'team' | 'billing';

export function Settings() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: org, isLoading: orgLoading } = useCurrentOrganization();
  const { data: currentRole } = useCurrentUserRole(org?.id || '');
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(org?.id || '');
  const { data: invitations = [] } = useInvitations(org?.id || '');
  const { data: subscription } = useSubscription(org?.id || '');
  const { data: usageSummary } = useUsageSummary(org?.id || '');
  
  const updateOrg = useUpdateOrganization();
  const createInvite = useCreateInvitation();
  const deleteInvite = useDeleteInvitation();
  const resendInvite = useResendInvitation();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();
  const createPortal = useCreatePortalSession();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: '', onConfirm: () => {} });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // API Keys state
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';
  const currentTier = subscription?.tier || 'free';
  const currentPlan = getPlan(currentTier);

  // Initialize org name when loaded
  if (org && !orgName) {
    setOrgName(org.name);
  }

  // Load saved API keys from localStorage
  useEffect(() => {
    if (org) {
      try {
        const savedKeys = localStorage.getItem(`api_keys_${org.id}`);
        if (savedKeys) {
          const keys = JSON.parse(savedKeys);
          if (keys.anthropic) setAnthropicKey(keys.anthropic);
          if (keys.openai) setOpenaiKey(keys.openai);
          if (keys.deepseek) setDeepseekKey(keys.deepseek);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [org]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    };
    
    loadProfile();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(),
          avatar_url: avatarUrl.trim() || null
        })
        .eq('id', user.id);
      
      if (error) throw error;
      showToast('Profile updated');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!org || !orgName.trim()) return;
    
    try {
      await updateOrg.mutateAsync({ id: org.id, input: { name: orgName.trim() } });
      showToast('Organization updated');
    } catch {
      showToast('Failed to update organization', 'error');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !inviteEmail.trim()) return;

    try {
      await createInvite.mutateAsync({
        orgId: org.id,
        input: { email: inviteEmail.trim(), role: inviteRole },
      });
      showToast('Invitation sent');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      showToast(message, 'error');
    }
  };

  const handleCopyInviteLink = async (invitation: Invitation) => {
    const link = `${window.location.origin}/invite/${invitation.token}`;
    await navigator.clipboard.writeText(link);
    setCopiedInvite(invitation.id);
    showToast('Invite link copied');
    setTimeout(() => setCopiedInvite(null), 2000);
  };

  const handleDeleteInvite = (invitation: Invitation) => {
    if (!org) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Invitation',
      message: `Are you sure you want to cancel the invitation to ${invitation.email}?`,
      confirmText: 'Cancel Invitation',
      onConfirm: async () => {
        try {
          await deleteInvite.mutateAsync({ invitationId: invitation.id, orgId: org.id });
          showToast('Invitation cancelled');
        } catch {
          showToast('Failed to cancel invitation', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleResendInvite = async (invitation: Invitation) => {
    setResendingInvite(invitation.id);
    try {
      await resendInvite.mutateAsync(invitation);
      showToast('Invitation email sent');
    } catch {
      showToast('Failed to send invitation email', 'error');
    } finally {
      setResendingInvite(null);
    }
  };

  const handleRoleChange = async (member: OrganizationMember, newRole: 'admin' | 'member') => {
    if (!org) return;

    try {
      await updateRole.mutateAsync({ memberId: member.id, role: newRole, orgId: org.id });
      showToast('Member role updated');
    } catch {
      showToast('Failed to update role', 'error');
    }
  };

  const handleRemoveMember = (member: OrganizationMember) => {
    if (!org) return;
    const memberName = member.user?.full_name || member.user?.email || 'this member';
    
    setConfirmModal({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName} from the organization? They will lose access immediately.`,
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await removeMember.mutateAsync({ memberId: member.id, orgId: org.id });
          showToast('Member removed');
        } catch {
          showToast('Failed to remove member', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleTransferOwnership = (member: OrganizationMember) => {
    if (!org) return;
    const memberName = member.user?.full_name || member.user?.email || 'this member';
    
    setConfirmModal({
      isOpen: true,
      title: 'Transfer Ownership',
      message: `Are you sure you want to transfer ownership to ${memberName}? You will become an admin and cannot undo this action.`,
      confirmText: 'Transfer',
      onConfirm: async () => {
        try {
          await transferOwnership.mutateAsync({ orgId: org.id, newOwnerId: member.user_id });
          showToast('Ownership transferred');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to transfer ownership';
          showToast(message, 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleManageBilling = async () => {
    if (!org) return;
    try {
      const { url } = await createPortal.mutateAsync(org.id);
      window.location.href = url;
    } catch {
      showToast('Failed to open billing portal', 'error');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-amber-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  if (orgLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-slate-500">No organization found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <h1 className="font-display font-semibold text-2xl text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile, organization, team, and billing</p>
      </header>

      {/* Content */}
      <main className="p-8">
        <div className="max-w-4xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-slate-200">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'general', label: 'General', icon: Building2 },
              { id: 'team', label: 'Team', icon: Users },
              { id: 'billing', label: 'Billing', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-sway-500 text-sway-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Your Profile</h2>
                
                <div className="space-y-6 max-w-md">
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-sway-100 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-sway-600">
                              {fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <button
                          className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                          title="Change profile picture"
                          onClick={() => {
                            const url = prompt('Enter image URL:', avatarUrl);
                            if (url !== null) setAvatarUrl(url);
                          }}
                        >
                          <Camera className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                      <div className="text-sm text-slate-500">
                        <p>Click the camera icon to add a profile picture.</p>
                        <p className="text-xs mt-1">Paste an image URL (e.g., from Gravatar)</p>
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
                      {user?.email || 'No email'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    loading={savingProfile}
                  >
                    Save Profile
                  </Button>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Security</h2>
                
                <div className="space-y-4 max-w-md">
                  <p className="text-sm text-slate-500">
                    To change your password, click below and follow the instructions sent to your email.
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!user?.email) return;
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: `${window.location.origin}/auth?reset=true`,
                        });
                        if (error) throw error;
                        showToast('Password reset email sent');
                      } catch {
                        showToast('Failed to send reset email', 'error');
                      }
                    }}
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Organization Details</h2>
                
                <div className="space-y-4 max-w-md">
                  <Input
                    label="Organization Name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!isAdmin}
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Organization ID
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 font-mono">
                        {org.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(org.id);
                          showToast('Copied');
                        }}
                        title="Copy Organization ID"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isAdmin && (
                    <Button
                      onClick={handleSaveOrg}
                      loading={updateOrg.isPending}
                      disabled={orgName === org.name}
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              {/* API Keys Section */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-slate-600" />
                    <h2 className="font-semibold text-slate-800">AI Provider API Keys</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">
                    Add your own API keys to use different AI providers. Keys are stored securely and used for email generation.
                  </p>

                  <div className="space-y-4 max-w-lg">
                    {/* Anthropic */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Anthropic API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showAnthropicKey ? 'text' : 'password'}
                            value={anthropicKey}
                            onChange={(e) => setAnthropicKey(e.target.value)}
                            placeholder="sk-ant-..."
                            className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 outline-none text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            title={showAnthropicKey ? 'Hide API key' : 'Show API key'}
                          >
                            {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">For Claude Sonnet 4 (best quality)</p>
                    </div>

                    {/* OpenAI */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        OpenAI API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showOpenaiKey ? 'text' : 'password'}
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 outline-none text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            title={showOpenaiKey ? 'Hide API key' : 'Show API key'}
                          >
                            {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">For GPT-4o (fast)</p>
                    </div>

                    {/* DeepSeek */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        DeepSeek API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showDeepseekKey ? 'text' : 'password'}
                            value={deepseekKey}
                            onChange={(e) => setDeepseekKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20 outline-none text-sm font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            title={showDeepseekKey ? 'Hide API key' : 'Show API key'}
                          >
                            {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">For DeepSeek (cheapest)</p>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={async () => {
                          setSavingKeys(true);
                          try {
                            // Store keys in localStorage for now
                            // In production, these should be stored securely in the database
                            const keys = {
                              anthropic: anthropicKey || undefined,
                              openai: openaiKey || undefined,
                              deepseek: deepseekKey || undefined,
                            };
                            localStorage.setItem(`api_keys_${org.id}`, JSON.stringify(keys));
                            showToast('API keys saved');
                          } catch {
                            showToast('Failed to save API keys', 'error');
                          } finally {
                            setSavingKeys(false);
                          }
                        }}
                        loading={savingKeys}
                      >
                        Save API Keys
                      </Button>
                      <p className="text-xs text-slate-400 mt-2">
                        Keys are stored locally in this browser. For team-wide keys, contact support.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Members Section */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800">Team Members: {members.length}</h2>
                  {isAdmin && (
                    <Button onClick={() => setShowInviteModal(true)} size="sm">
                      <Plus className="w-4 h-4" />
                      Invite Member
                    </Button>
                  )}
                </div>

                {membersLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-sway-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                        {isAdmin && <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((member) => {
                        const isOwner = currentRole === 'owner';
                        const isSelf = member.user_id === user?.id;
                        const memberName = member.user?.full_name || member.user?.email || 'Unknown';
                        const memberInitial = member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0)?.toUpperCase() || 'U';
                        
                        return (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-slate-600">
                                    {memberInitial}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {memberName}
                                    {isSelf && (
                                      <span className="ml-2 text-xs text-slate-400">(you)</span>
                                    )}
                                  </p>
                                  {member.user?.full_name && member.user?.email && (
                                    <p className="text-sm text-slate-500">{member.user.email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(member.role)}
                                {isAdmin && member.role !== 'owner' && !isSelf ? (
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member, e.target.value as 'admin' | 'member')}
                                    className="text-sm bg-transparent border-0 cursor-pointer text-slate-700 focus:outline-none"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                  </select>
                                ) : (
                                  <span className="text-sm text-slate-700 capitalize">{member.role}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  {/* Transfer ownership - only owner can do this, and not to themselves */}
                                  {isOwner && !isSelf && member.role !== 'owner' && (
                                    <button
                                      onClick={() => handleTransferOwnership(member)}
                                      className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                      title="Transfer ownership"
                                    >
                                      <Crown className="w-4 h-4" />
                                    </button>
                                  )}
                                  {/* Remove member - owner can remove anyone except themselves */}
                                  {!isSelf && member.role !== 'owner' && (
                                    <button
                                      onClick={() => handleRemoveMember(member)}
                                      className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Remove member"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pending Invitations */}
              {isAdmin && invitations.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">Pending Invitations: {invitations.length}</h2>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {invitations.map((invite) => (
                      <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{invite.email}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="capitalize">{invite.role}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(invite)}
                            title="Resend invitation email"
                            loading={resendingInvite === invite.id}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteLink(invite)}
                            title="Copy invite link"
                          >
                            {copiedInvite === invite.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvite(invite)}
                            className="text-red-500 hover:bg-red-50"
                            title="Cancel invitation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-semibold text-slate-800">Current Plan</h2>
                    <p className="text-sm text-slate-500">Manage your subscription and billing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentTier === 'free' 
                        ? 'bg-slate-100 text-slate-600'
                        : currentTier === 'agency'
                        ? 'bg-sway-100 text-sway-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {currentPlan.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Brands</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {currentPlan.limits.brands === -1 ? '∞' : currentPlan.limits.brands}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Emails/mo</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {currentPlan.limits.emailsPerMonth === -1 ? '∞' : currentPlan.limits.emailsPerMonth}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Team</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {currentPlan.limits.teamMembers === -1 ? '∞' : currentPlan.limits.teamMembers}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Templates</p>
                    <p className="text-2xl font-semibold text-slate-800">
                      {currentPlan.limits.templates === -1 ? '∞' : currentPlan.limits.templates}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {currentTier !== 'agency' && (
                    <Button onClick={() => setShowUpgradeModal(true)}>
                      <Sparkles className="w-4 h-4" />
                      Upgrade Plan
                    </Button>
                  )}
                  {currentTier !== 'free' && (
                    <Button 
                      variant="outline" 
                      onClick={handleManageBilling}
                      loading={createPortal.isPending}
                    >
                      Manage Billing
                    </Button>
                  )}
                </div>
              </div>

              {/* Usage */}
              {usageSummary && (
                <div className="bg-white rounded-xl border border-slate-100 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h2 className="font-semibold text-slate-800">Current Usage</h2>
                    <span className="text-xs text-slate-400 ml-auto">
                      Resets monthly
                    </span>
                  </div>

                  <div className="space-y-6">
                    <UsageBar
                      label="Emails Generated"
                      current={usageSummary.currentPeriod.emailsGenerated}
                      limit={usageSummary.limits.emailsPerMonth}
                    />
                    <UsageBar
                      label="Brands"
                      current={usageSummary.percentages.brands > 0 ? Math.round(usageSummary.percentages.brands * usageSummary.limits.brands / 100) : 0}
                      limit={usageSummary.limits.brands}
                    />
                    <UsageBar
                      label="Team Members"
                      current={usageSummary.percentages.members > 0 ? Math.round(usageSummary.percentages.members * usageSummary.limits.teamMembers / 100) : 0}
                      limit={usageSummary.limits.teamMembers}
                    />
                    <UsageBar
                      label="Templates"
                      current={usageSummary.percentages.templates > 0 ? Math.round(usageSummary.percentages.templates * usageSummary.limits.templates / 100) : 0}
                      limit={usageSummary.limits.templates}
                    />
                  </div>

                  {usageSummary.currentPeriod.tokensUsed > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <p className="text-sm text-slate-500">
                        Total tokens used this period: <span className="font-medium text-slate-700">{usageSummary.currentPeriod.tokensUsed.toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Plan Comparison */}
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <h2 className="font-semibold text-slate-800 mb-4">Compare Plans</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 font-medium text-slate-500">Feature</th>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <th key={plan.id} className={`text-center py-3 font-medium ${
                            plan.id === currentTier ? 'text-sway-600' : 'text-slate-500'
                          }`}>
                            {plan.name}
                            {plan.id === currentTier && (
                              <span className="ml-1 text-xs">(Current)</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-3 text-slate-600">Brands</td>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <td key={plan.id} className="py-3 text-center">
                            {plan.limits.brands === -1 ? 'Unlimited' : plan.limits.brands}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-600">Emails/month</td>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <td key={plan.id} className="py-3 text-center">
                            {plan.limits.emailsPerMonth === -1 ? 'Unlimited' : plan.limits.emailsPerMonth}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-600">Team members</td>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <td key={plan.id} className="py-3 text-center">
                            {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-600">API access</td>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <td key={plan.id} className="py-3 text-center">
                            {plan.limits.apiAccess ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : '—'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-600">Priority support</td>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <td key={plan.id} className="py-3 text-center">
                            {plan.limits.prioritySupport ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : '—'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 text-slate-600">Price</td>
                        {SUBSCRIPTION_PLANS.map(plan => (
                          <td key={plan.id} className="py-3 text-center font-medium">
                            {plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice}/mo`}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        size="sm"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@agency.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
            options={[
              { value: 'member', label: 'Member - Can view and edit brands' },
              { value: 'admin', label: 'Admin - Can also manage team' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={createInvite.isPending} className="flex-1">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        orgId={org.id}
        currentTier={currentTier}
      />

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-slate-600">{confirmModal.message}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmModal.onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {confirmModal.confirmText}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
