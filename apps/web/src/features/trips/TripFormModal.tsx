import { Button, Group, Modal, Stack, Switch, TextInput, Textarea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import type { CreateTripInput, Trip } from '@ridebook/shared';
import { useCreateTrip, useUpdateTrip } from './mutations';

interface TripFormValues {
  name: string;
  description: string;
  /** YYYY-MM-DD, which is what Mantine's DateInput works with. */
  plannedDate: string | null;
  /** RULE-008: a trip counts as driven once this is on. */
  driven: boolean;
  drivenAt: string | null;
}

interface TripFormModalProps {
  /** Null means "create a new trip". */
  trip: Trip | null;
  onClose: () => void;
}

export function TripFormModal({ trip, onClose }: TripFormModalProps) {
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  const form = useForm<TripFormValues>({
    initialValues: {
      name: trip?.name ?? '',
      description: trip?.description ?? '',
      plannedDate: trip?.plannedDate ?? null,
      driven: trip ? trip.drivenAt !== null : false,
      drivenAt: dayjs(trip?.drivenAt ?? undefined).format('YYYY-MM-DD'),
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
    },
  });

  const isSaving = createTrip.isPending || updateTrip.isPending;

  const handleSubmit = form.onSubmit(async (values) => {
    const input: CreateTripInput = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      plannedDate: values.plannedDate || null,
      drivenAt: values.driven && values.drivenAt ? dayjs(values.drivenAt).toISOString() : null,
    };

    try {
      if (trip) {
        await updateTrip.mutateAsync({ id: trip.id, input });
      } else {
        await createTrip.mutateAsync(input);
      }
      onClose();
    } catch {
      // The mutation already reported the failure as a notification.
    }
  });

  return (
    <Modal opened onClose={onClose} title={trip ? 'Edit trip' : 'New trip'} centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Name"
            placeholder="Lakeland loop"
            withAsterisk
            data-autofocus
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="What is the plan?"
            autosize
            minRows={2}
            maxRows={6}
            {...form.getInputProps('description')}
          />

          <DateInput
            label="Planned for"
            placeholder="Pick a date"
            valueFormat="D MMM YYYY"
            clearable
            {...form.getInputProps('plannedDate')}
          />

          <Switch label="Driven" {...form.getInputProps('driven', { type: 'checkbox' })} />

          {form.values.driven && (
            <DateInput label="Driven on" valueFormat="D MMM YYYY" {...form.getInputProps('drivenAt')} />
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {trip ? 'Save' : 'Create trip'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
