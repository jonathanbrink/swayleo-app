import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as knowledgeApi from '../lib/knowledge';
import type { KnowledgeCategory, CreateKnowledgeEntryInput, UpdateKnowledgeEntryInput } from '../types/knowledge';

// ============================================
// Query Keys
// ============================================

export const knowledgeKeys = {
  all: (brandId: string) => ['knowledge', brandId] as const,
  list: (brandId: string, category?: KnowledgeCategory) => ['knowledge', brandId, 'list', category] as const,
  detail: (id: string) => ['knowledge', 'detail', id] as const,
  stats: (brandId: string) => ['knowledge', brandId, 'stats'] as const,
  search: (brandId: string, query: string) => ['knowledge', brandId, 'search', query] as const,
  forGeneration: (brandId: string, emailType?: string) => ['knowledge', brandId, 'generation', emailType] as const,
};

// ============================================
// Knowledge Entry List Hooks
// ============================================

export function useKnowledgeEntries(brandId: string, category?: KnowledgeCategory) {
  return useQuery({
    queryKey: knowledgeKeys.list(brandId, category),
    queryFn: () => knowledgeApi.getKnowledgeEntries(brandId, category),
    enabled: !!brandId,
  });
}

export function useKnowledgeEntry(id: string) {
  return useQuery({
    queryKey: knowledgeKeys.detail(id),
    queryFn: () => knowledgeApi.getKnowledgeEntry(id),
    enabled: !!id,
  });
}

export function useKnowledgeStats(brandId: string) {
  return useQuery({
    queryKey: knowledgeKeys.stats(brandId),
    queryFn: () => knowledgeApi.getKnowledgeStats(brandId),
    enabled: !!brandId,
  });
}

export function useSearchKnowledge(brandId: string, searchQuery: string) {
  return useQuery({
    queryKey: knowledgeKeys.search(brandId, searchQuery),
    queryFn: () => knowledgeApi.searchKnowledgeEntries(brandId, searchQuery),
    enabled: !!brandId && searchQuery.length >= 2,
  });
}

export function useKnowledgeForGeneration(brandId: string, emailType?: string) {
  return useQuery({
    queryKey: knowledgeKeys.forGeneration(brandId, emailType),
    queryFn: () => knowledgeApi.getKnowledgeForGeneration(brandId, emailType),
    enabled: !!brandId,
  });
}

// ============================================
// Knowledge Entry Mutation Hooks
// ============================================

export function useCreateKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateKnowledgeEntryInput) =>
      knowledgeApi.createKnowledgeEntry(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(variables.brand_id) });
    },
  });
}

export function useUpdateKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKnowledgeEntryInput; brandId: string }) =>
      knowledgeApi.updateKnowledgeEntry(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(variables.brandId) });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(variables.id) });
    },
  });
}

export function useDeleteKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; brandId: string }) =>
      knowledgeApi.deleteKnowledgeEntry(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(variables.brandId) });
    },
  });
}

export function useToggleKnowledgeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean; brandId: string }) =>
      knowledgeApi.toggleKnowledgeEntry(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(variables.brandId) });
    },
  });
}

export function useCreateBulkKnowledgeEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entries }: { entries: CreateKnowledgeEntryInput[]; brandId: string }) =>
      knowledgeApi.createBulkKnowledgeEntries(entries),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all(variables.brandId) });
    },
  });
}
