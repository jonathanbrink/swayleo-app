import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as orgApi from '../lib/organization';
import { useAuth } from './useAuth';
import type { UpdateOrganizationInput, InviteMemberInput } from '../types/organization';

// ============================================
// Query Keys
// ============================================

export const orgKeys = {
  current: ['organization', 'current'] as const,
  detail: (id: string) => ['organization', id] as const,
  list: ['organizations'] as const,
  members: (orgId: string) => ['organization', orgId, 'members'] as const,
  invitations: (orgId: string) => ['organization', orgId, 'invitations'] as const,
  role: (orgId: string) => ['organization', orgId, 'role'] as const,
  onboarding: (orgId: string) => ['organization', orgId, 'onboarding'] as const,
};

// ============================================
// Organization Hooks
// ============================================

export function useCurrentOrganization() {
  const { isAuthenticated, loading } = useAuth();
  
  return useQuery({
    queryKey: orgKeys.current,
    queryFn: orgApi.getCurrentOrganization,
    enabled: isAuthenticated && !loading,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: orgKeys.detail(id),
    queryFn: () => orgApi.getOrganization(id),
    enabled: !!id,
  });
}

export function useUserOrganizations() {
  return useQuery({
    queryKey: orgKeys.list,
    queryFn: orgApi.getUserOrganizations,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => orgApi.createOrganization(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.current });
      queryClient.invalidateQueries({ queryKey: orgKeys.list });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrganizationInput }) =>
      orgApi.updateOrganization(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.current });
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(data.id) });
    },
  });
}

// ============================================
// Members Hooks
// ============================================

export function useOrganizationMembers(orgId: string) {
  return useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: () => orgApi.getOrganizationMembers(orgId),
    enabled: !!orgId,
  });
}

export function useCurrentUserRole(orgId: string) {
  return useQuery({
    queryKey: orgKeys.role(orgId),
    queryFn: () => orgApi.getCurrentUserRole(orgId),
    enabled: !!orgId,
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'admin' | 'member'; orgId: string }) =>
      orgApi.updateMemberRole(memberId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(variables.orgId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId }: { memberId: string; orgId: string }) =>
      orgApi.removeMember(memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(variables.orgId) });
    },
  });
}

// ============================================
// Invitations Hooks
// ============================================

export function useInvitations(orgId: string) {
  return useQuery({
    queryKey: orgKeys.invitations(orgId),
    queryFn: () => orgApi.getInvitations(orgId),
    enabled: !!orgId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, input }: { orgId: string; input: InviteMemberInput }) =>
      orgApi.createInvitation(orgId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations(variables.orgId) });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId }: { invitationId: string; orgId: string }) =>
      orgApi.deleteInvitation(invitationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.invitations(variables.orgId) });
    },
  });
}

export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => orgApi.getInvitationByToken(token),
    enabled: !!token,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => orgApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.current });
      queryClient.invalidateQueries({ queryKey: orgKeys.list });
    },
  });
}

// ============================================
// Onboarding Hook
// ============================================

export function useOnboardingStatus(orgId: string) {
  return useQuery({
    queryKey: orgKeys.onboarding(orgId),
    queryFn: () => orgApi.checkOnboardingStatus(orgId),
    enabled: !!orgId,
  });
}
