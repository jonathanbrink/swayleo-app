import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as emailApi from '../lib/email';
import type { Brand, BrandKit } from '../types';
import type { 
  EmailGenerationRequest, 
  GeneratedEmail, 
  SavedEmail,
  LLMProvider 
} from '../types/email';

// ============================================
// Email Generation Hook
// ============================================

export function useEmailGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    brand: Brand,
    kit: BrandKit,
    request: EmailGenerationRequest,
    provider?: LLMProvider
  ) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await emailApi.generateEmail(brand, kit, request, provider);
      setGeneratedEmail(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate email';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setGeneratedEmail(null);
    setError(null);
  }, []);

  return {
    generate,
    reset,
    isGenerating,
    generatedEmail,
    error,
  };
}

// ============================================
// Saved Emails Hooks
// ============================================

export const savedEmailKeys = {
  list: (brandId: string) => ['saved_emails', brandId] as const,
};

export function useSavedEmails(brandId: string) {
  return useQuery({
    queryKey: savedEmailKeys.list(brandId),
    queryFn: () => emailApi.getSavedEmails(brandId),
    enabled: !!brandId,
  });
}

export function useSaveEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: Omit<SavedEmail, 'id' | 'created_at' | 'updated_at'>) => 
      emailApi.saveEmail(email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savedEmailKeys.list(variables.brand_id) });
    },
  });
}

export function useUpdateSavedEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: Parameters<typeof emailApi.updateSavedEmail>[1];
      brandId: string;
    }) => emailApi.updateSavedEmail(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savedEmailKeys.list(variables.brandId) });
    },
  });
}

export function useDeleteSavedEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; brandId: string }) => 
      emailApi.deleteSavedEmail(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: savedEmailKeys.list(variables.brandId) });
    },
  });
}
