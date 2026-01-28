import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import type { UpdateBrandKitInput } from '../types';
import { brandKeys } from './useBrands';

export const brandKitKeys = {
  detail: (brandId: string) => ['brand_kits', brandId] as const,
};

export function useBrandKit(brandId: string) {
  return useQuery({
    queryKey: brandKitKeys.detail(brandId),
    queryFn: () => api.getBrandKit(brandId),
    enabled: !!brandId,
  });
}

export function useUpdateBrandKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, input }: { brandId: string; input: UpdateBrandKitInput }) =>
      api.updateBrandKit(brandId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKitKeys.detail(data.brand_id) });
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
}
