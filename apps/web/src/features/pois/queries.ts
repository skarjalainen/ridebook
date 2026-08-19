import { useQuery } from '@tanstack/react-query';
import type { PoiCategory, PoiFeatureCollection } from '@ridebook/shared';
import { apiFetch } from '../../api/client';

export const poiKeys = {
  categories: ['poi-categories'] as const,
  list: ['pois'] as const,
};

export function usePoiCategories() {
  return useQuery({
    queryKey: poiKeys.categories,
    queryFn: () => apiFetch<PoiCategory[]>('/api/poi-categories'),
    staleTime: Infinity,
  });
}

export function usePois() {
  return useQuery({
    queryKey: poiKeys.list,
    // The full collection is small enough to filter client-side, which keeps
    // category toggles instant. The bbox parameter stays available for later.
    queryFn: () => apiFetch<PoiFeatureCollection>('/api/pois'),
  });
}
