import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as templateApi from '../lib/templates';
import type { CreateTemplateInput, UpdateTemplateInput, TemplateCategory } from '../types/template';

// ============================================
// Query Keys
// ============================================

export const templateKeys = {
  all: (orgId: string) => ['templates', orgId] as const,
  list: (orgId: string, category?: TemplateCategory) => ['templates', orgId, 'list', category] as const,
  byType: (orgId: string, emailType: string) => ['templates', orgId, 'type', emailType] as const,
  detail: (id: string) => ['templates', 'detail', id] as const,
  popular: (orgId: string) => ['templates', orgId, 'popular'] as const,
};

// ============================================
// Template List Hooks
// ============================================

export function useTemplates(orgId: string, category?: TemplateCategory) {
  return useQuery({
    queryKey: templateKeys.list(orgId, category),
    queryFn: () => templateApi.getTemplates(orgId, category),
    enabled: !!orgId,
  });
}

export function useTemplatesByType(orgId: string, emailType: string) {
  return useQuery({
    queryKey: templateKeys.byType(orgId, emailType),
    queryFn: () => templateApi.getTemplatesByType(orgId, emailType),
    enabled: !!orgId && !!emailType,
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templateApi.getTemplate(id),
    enabled: !!id,
  });
}

export function usePopularTemplates(orgId: string, limit?: number) {
  return useQuery({
    queryKey: templateKeys.popular(orgId),
    queryFn: () => templateApi.getPopularTemplates(orgId, limit),
    enabled: !!orgId,
  });
}

// ============================================
// Template Mutation Hooks
// ============================================

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, input }: { orgId: string; input: CreateTemplateInput }) =>
      templateApi.createTemplate(orgId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(variables.orgId) });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput; orgId: string }) =>
      templateApi.updateTemplate(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(variables.orgId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; orgId: string }) =>
      templateApi.deleteTemplate(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(variables.orgId) });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string; orgId: string }) =>
      templateApi.duplicateTemplate(id, newName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(variables.orgId) });
    },
  });
}

export function useIncrementTemplateUse() {
  return useMutation({
    mutationFn: (templateId: string) => templateApi.incrementTemplateUse(templateId),
  });
}
