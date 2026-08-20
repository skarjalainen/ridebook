import { useQuery } from '@tanstack/react-query';
import type { Trip } from '@ridebook/shared';
import { apiFetch } from '../../api/client';

export const tripKeys = {
  list: ['trips'] as const,
  detail: (id: string) => ['trips', id] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: tripKeys.list,
    queryFn: () => apiFetch<Trip[]>('/api/trips'),
  });
}
