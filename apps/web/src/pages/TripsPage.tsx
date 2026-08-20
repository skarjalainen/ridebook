import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconAlertTriangle, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Trip } from '@ridebook/shared';
import { TripFormModal } from '../features/trips/TripFormModal';
import { useTrips } from '../features/trips/queries';
import { useDeleteTrip } from '../features/trips/mutations';

type FormTarget = { mode: 'create' } | { mode: 'edit'; trip: Trip };

const formatDate = (value: string) => dayjs(value).format('D MMM YYYY');

export function TripsPage() {
  const tripsQuery = useTrips();
  const deleteTrip = useDeleteTrip();

  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);

  const confirmDelete = (trip: Trip) => {
    modals.openConfirmModal({
      title: 'Delete trip',
      children: <Text size="sm">Delete “{trip.name}”? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteTrip.mutate(trip.id),
    });
  };

  const trips = tripsQuery.data ?? [];

  return (
    <Container size="sm" py="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Trips</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setFormTarget({ mode: 'create' })}>
          New trip
        </Button>
      </Group>

      {tripsQuery.isPending && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {tripsQuery.isError && (
        <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Could not load trips">
          {tripsQuery.error.message}
        </Alert>
      )}

      {tripsQuery.isSuccess && trips.length === 0 && (
        <Card withBorder padding="lg">
          <Text c="dimmed">No trips yet. Create one to start planning a ride.</Text>
        </Card>
      )}

      <Stack gap="sm">
        {trips.map((trip) => (
          <Card key={trip.id} withBorder padding="md">
            <Stack gap={4}>
              <Group gap="xs">
                <Text fw={600}>{trip.name}</Text>
                {trip.drivenAt ? (
                  <Badge color="green" variant="light">
                    Driven {formatDate(trip.drivenAt)}
                  </Badge>
                ) : (
                  <Badge variant="light">Planned</Badge>
                )}
              </Group>

              {trip.plannedDate && (
                <Text size="sm" c="dimmed">
                  Planned for {formatDate(trip.plannedDate)}
                </Text>
              )}

              {trip.description && <Text size="sm">{trip.description}</Text>}

              <Group gap="xs" mt="xs">
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconPencil size={14} />}
                  onClick={() => setFormTarget({ mode: 'edit', trip })}
                >
                  Edit
                </Button>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => confirmDelete(trip)}
                >
                  Delete
                </Button>
              </Group>
            </Stack>
          </Card>
        ))}
      </Stack>

      {formTarget && (
        <TripFormModal
          trip={formTarget.mode === 'edit' ? formTarget.trip : null}
          onClose={() => setFormTarget(null)}
        />
      )}
    </Container>
  );
}
