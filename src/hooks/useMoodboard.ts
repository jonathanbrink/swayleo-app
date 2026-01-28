import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import type { MoodboardAsset } from '../types';

export const moodboardKeys = {
  list: (brandId: string) => ['moodboard', brandId] as const,
};

export function useMoodboardAssets(brandId: string) {
  return useQuery({
    queryKey: moodboardKeys.list(brandId),
    queryFn: () => api.getMoodboardAssets(brandId),
    enabled: !!brandId,
  });
}

export function useUploadMoodboardAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ brandId, file }: { brandId: string; file: File }) =>
      api.uploadMoodboardAsset(brandId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moodboardKeys.list(variables.brandId) });
    },
  });
}

export function useDeleteMoodboardAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: MoodboardAsset) => api.deleteMoodboardAsset(asset),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moodboardKeys.list(variables.brand_id) });
    },
  });
}
