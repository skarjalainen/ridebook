import { useState } from 'react';
import {
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  TextInput,
  Textarea,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import dayjs from 'dayjs';
import type { CreatePoiInput, PoiCategory, PoiFeature, Position } from '@ridebook/shared';
import { useGeocodingSearch } from '../geocoding/queries';
import { useCreatePoi, useUpdatePoi } from './mutations';

interface PoiFormValues {
  name: string;
  categoryId: string;
  description: string;
  visited: boolean;
  /** YYYY-MM-DD, which is what Mantine's DateInput works with. */
  visitedAt: string | null;
  longitude: number | string;
  latitude: number | string;
}

interface PoiFormModalProps {
  categories: PoiCategory[];
  /** Null means "create a new POI". */
  poi: PoiFeature | null;
  initialLocation: Position | null;
  onClose: () => void;
  onSaved: (poi: PoiFeature) => void;
}

const coordinateValidator = (limit: number, label: string) => (value: number | string) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return `${label} is required`;
  return Math.abs(parsed) <= limit ? null : `${label} must be between -${limit} and ${limit}`;
};

export function PoiFormModal({
  categories,
  poi,
  initialLocation,
  onClose,
  onSaved,
}: PoiFormModalProps) {
  const createPoi = useCreatePoi();
  const updatePoi = useUpdatePoi();

  const [placeId, setPlaceId] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [debouncedPlaceQuery] = useDebouncedValue(placeQuery, 300);

  // The POI already sits somewhere sensible, so bias the search towards it.
  const searchOrigin: Position | undefined = poi
    ? poi.geometry.coordinates
    : (initialLocation ?? undefined);
  const placesQuery = useGeocodingSearch(debouncedPlaceQuery, searchOrigin);
  const places = placesQuery.data?.results ?? [];

  const form = useForm<PoiFormValues>({
    initialValues: {
      name: poi?.properties.name ?? '',
      categoryId: poi?.properties.categoryId ?? '',
      description: poi?.properties.description ?? '',
      visited: poi ? poi.properties.visitedAt !== null : false,
      visitedAt: dayjs(poi?.properties.visitedAt ?? undefined).format('YYYY-MM-DD'),
      longitude: poi?.geometry.coordinates[0] ?? initialLocation?.[0] ?? '',
      latitude: poi?.geometry.coordinates[1] ?? initialLocation?.[1] ?? '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      categoryId: (value) => (value ? null : 'Category is required'),
      longitude: coordinateValidator(180, 'Longitude'),
      latitude: coordinateValidator(90, 'Latitude'),
    },
  });

  const isSaving = createPoi.isPending || updatePoi.isPending;

  const handleSubmit = form.onSubmit(async (values) => {
    const input: CreatePoiInput = {
      name: values.name.trim(),
      categoryId: values.categoryId,
      description: values.description.trim() || null,
      location: {
        type: 'Point',
        coordinates: [Number(values.longitude), Number(values.latitude)],
      },
      visitedAt: values.visited && values.visitedAt ? dayjs(values.visitedAt).toISOString() : null,
    };

    try {
      const saved = poi
        ? await updatePoi.mutateAsync({ id: poi.properties.id, input })
        : await createPoi.mutateAsync(input);

      onSaved(saved);
      onClose();
    } catch {
      // The mutation already reported the failure as a notification.
    }
  });

  const handlePlaceChange = (value: string | null) => {
    setPlaceId(value);

    const place = places.find((result) => result.id === value);
    if (!place) return;

    form.setFieldValue('longitude', place.position[0]);
    form.setFieldValue('latitude', place.position[1]);

    // Labels read "Koli (village), Lieksa, Suomi"; only the place name is a
    // sensible POI name, and the rest is context for picking the right result.
    if (!form.values.name.trim()) {
      form.setFieldValue('name', place.label.replace(/,.*$/s, '').replace(/\s*\([^)]*\)$/, ''));
    }
  };

  return (
    <Modal opened onClose={onClose} title={poi ? 'Edit POI' : 'Add POI'} centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Name"
            placeholder="Koli lookout"
            withAsterisk
            data-autofocus
            {...form.getInputProps('name')}
          />

          <Select
            label="Category"
            placeholder="Pick a category"
            withAsterisk
            data={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            {...form.getInputProps('categoryId')}
          />

          <Textarea
            label="Description"
            placeholder="What makes this place worth the detour?"
            autosize
            minRows={2}
            maxRows={6}
            {...form.getInputProps('description')}
          />

          <Switch
            label="Visited"
            {...form.getInputProps('visited', { type: 'checkbox' })}
          />

          {form.values.visited && (
            <DateInput
              label="Visited on"
              valueFormat="D MMM YYYY"
              {...form.getInputProps('visitedAt')}
            />
          )}

          <Divider label="Location" labelPosition="left" />

          <Select
            label="Find a place"
            placeholder="Search for an address or landmark"
            searchable
            clearable
            data={places.map((place) => ({ value: place.id, label: place.label }))}
            value={placeId}
            searchValue={placeQuery}
            onSearchChange={setPlaceQuery}
            onChange={handlePlaceChange}
            // Results are already ranked by the provider, so keep them all.
            filter={({ options }) => options}
            rightSection={placesQuery.isFetching ? <Loader size="xs" /> : undefined}
            nothingFoundMessage={placesQuery.isFetching ? undefined : 'No places found'}
            error={placesQuery.isError ? placesQuery.error.message : undefined}
          />

          <Group grow>
            <NumberInput
              label="Latitude"
              decimalScale={5}
              step={0.001}
              {...form.getInputProps('latitude')}
            />
            <NumberInput
              label="Longitude"
              decimalScale={5}
              step={0.001}
              {...form.getInputProps('longitude')}
            />
          </Group>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {poi ? 'Save' : 'Add POI'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
