import { useQuery } from '@tanstack/react-query';
import type { GeocodingSearchResponse, Position } from '@ridebook/shared';
import { apiFetch } from '../../api/client';

export function useGeocodingSearch(term: string, near?: Position) {
  const q = term.trim();

  const params = new URLSearchParams({ q });
  if (near) {
    params.set('lon', String(near[0]));
    params.set('lat', String(near[1]));
  }

  return useQuery({
    queryKey: ['geocoding', params.toString()],
    queryFn: () => apiFetch<GeocodingSearchResponse>(`/api/geocoding/search?${params}`),
    // Matches the minimum length the API accepts.
    enabled: q.length >= 2,
    staleTime: 5 * 60_000,
  });
}
