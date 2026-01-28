import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as clientApi from '../lib/client';
import type { CreateClientAccessInput, SubmitApprovalInput } from '../types/client';

// ============================================
// Query Keys
// ============================================

export const clientKeys = {
  access: (brandId: string) => ['client', 'access', brandId] as const,
  approvals: (emailId: string) => ['client', 'approvals', emailId] as const,
  portal: (token: string) => ['client', 'portal', token] as const,
  brand: (token: string) => ['client', 'brand', token] as const,
  emails: (token: string) => ['client', 'emails', token] as const,
};

// ============================================
// Client Access Hooks (for org members)
// ============================================

export function useClientAccess(brandId: string) {
  return useQuery({
    queryKey: clientKeys.access(brandId),
    queryFn: () => clientApi.getClientAccess(brandId),
    enabled: !!brandId,
  });
}

export function useCreateClientAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientAccessInput) => clientApi.createClientAccess(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.access(variables.brand_id) });
    },
  });
}

export function useUpdateClientAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string; 
      brandId: string; 
      updates: { name?: string; access_level?: string; expires_at?: string | null } 
    }) => clientApi.updateClientAccess(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.access(variables.brandId) });
    },
  });
}

export function useDeleteClientAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; brandId: string }) => 
      clientApi.deleteClientAccess(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.access(variables.brandId) });
    },
  });
}

export function useRegenerateClientToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; brandId: string }) => 
      clientApi.regenerateClientToken(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.access(variables.brandId) });
    },
  });
}

// ============================================
// Email Approval Hooks
// ============================================

export function useEmailApprovals(savedEmailId: string) {
  return useQuery({
    queryKey: clientKeys.approvals(savedEmailId),
    queryFn: () => clientApi.getEmailApprovals(savedEmailId),
    enabled: !!savedEmailId,
  });
}

export function useRequestApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ emailId, clientAccessIds }: { emailId: string; clientAccessIds: string[] }) =>
      clientApi.requestApproval(emailId, clientAccessIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.approvals(variables.emailId) });
    },
  });
}

// ============================================
// Client Portal Hooks (for clients)
// ============================================

export function useClientPortal(token: string) {
  return useQuery({
    queryKey: clientKeys.portal(token),
    queryFn: () => clientApi.validateClientToken(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useClientBrand(token: string) {
  return useQuery({
    queryKey: clientKeys.brand(token),
    queryFn: () => clientApi.getClientBrand(token),
    enabled: !!token,
  });
}

export function useClientEmails(token: string) {
  return useQuery({
    queryKey: clientKeys.emails(token),
    queryFn: () => clientApi.getClientEmails(token),
    enabled: !!token,
  });
}

export function useSubmitApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      token, 
      emailId, 
      input 
    }: { 
      token: string; 
      emailId: string; 
      input: SubmitApprovalInput 
    }) => clientApi.submitApproval(token, emailId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.emails(variables.token) });
    },
  });
}
