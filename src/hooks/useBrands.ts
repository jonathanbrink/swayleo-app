import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import type { CreateBrandInput, UpdateBrandInput } from '../types';

export const brandKeys = {
  all: ['brands'] as const,
  detail: (id: string) => ['brands', id] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.all,
    queryFn: api.getBrands,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => api.getBrand(id),
    enabled: !!id,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBrandInput) => api.createBrand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBrandInput }) =>
      api.updateBrand(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(data.id) });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}
