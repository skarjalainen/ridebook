import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { CreateTripInput, Trip, UpdateTripInput } from '@ridebook/shared';
import { apiFetch } from '../../api/client';
import { tripKeys } from './queries';

const notifyFailure = (title: string) => (error: Error) => {
  notifications.show({ color: 'red', title, message: error.message });
};

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTripInput) =>
      apiFetch<Trip>('/api/trips', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (trip) => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.list });
      notifications.show({ color: 'green', message: `Added ${trip.name}` });
    },
    onError: notifyFailure('Could not add the trip'),
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTripInput }) =>
      apiFetch<Trip>(`/api/trips/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: (trip) => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.list });
      notifications.show({ color: 'green', message: `Updated ${trip.name}` });
    },
    onError: notifyFailure('Could not save the trip'),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/trips/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.list });
      notifications.show({ color: 'green', message: 'Trip deleted' });
    },
    onError: notifyFailure('Could not delete the trip'),
  });
}
