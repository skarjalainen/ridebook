import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { CreatePoiInput, PoiFeature, UpdatePoiInput } from '@ridebook/shared';
import { apiFetch } from '../../api/client';
import { poiKeys } from './queries';

const notifyFailure = (title: string) => (error: Error) => {
  notifications.show({ color: 'red', title, message: error.message });
};

export function useCreatePoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePoiInput) =>
      apiFetch<PoiFeature>('/api/pois', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (poi) => {
      void queryClient.invalidateQueries({ queryKey: poiKeys.list });
      notifications.show({ color: 'green', message: `Added ${poi.properties.name}` });
    },
    onError: notifyFailure('Could not add the POI'),
  });
}

export function useUpdatePoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePoiInput }) =>
      apiFetch<PoiFeature>(`/api/pois/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (poi) => {
      void queryClient.invalidateQueries({ queryKey: poiKeys.list });
      notifications.show({ color: 'green', message: `Updated ${poi.properties.name}` });
    },
    onError: notifyFailure('Could not save the POI'),
  });
}

export function useDeletePoi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/pois/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: poiKeys.list });
      notifications.show({ color: 'green', message: 'POI deleted' });
    },
    onError: notifyFailure('Could not delete the POI'),
  });
}
