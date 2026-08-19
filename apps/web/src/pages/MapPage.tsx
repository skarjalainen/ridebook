import { useMemo, useState } from 'react';
import { Alert, Box, Button, Center, Group, Loader, Paper, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconAlertTriangle, IconMapPinPlus } from '@tabler/icons-react';
import type { PoiFeature, Position } from '@ridebook/shared';
import { MapProvider } from '../features/map/MapProvider';
import { isMapConfigured } from '../features/map/mapStyles';
import { PoiLayers } from '../features/pois/PoiLayers';
import { PoiFilterBar } from '../features/pois/PoiFilterBar';
import { PoiDetailSheet } from '../features/pois/PoiDetailSheet';
import { PoiFormModal } from '../features/pois/PoiFormModal';
import { PoiPlacement } from '../features/pois/PoiPlacement';
import { usePoiCategories, usePois } from '../features/pois/queries';
import { useDeletePoi } from '../features/pois/mutations';

type FormTarget = { mode: 'create'; location: Position } | { mode: 'edit'; poi: PoiFeature };

export function MapPage() {
  const categoriesQuery = usePoiCategories();
  const poisQuery = usePois();
  const deletePoi = useDeletePoi();

  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const features = useMemo(() => poisQuery.data?.features ?? [], [poisQuery.data]);

  const selectedPoi = features.find((feature) => feature.properties.id === selectedPoiId) ?? null;
  const selectedCategory = categories.find(
    (category) => category.id === selectedPoi?.properties.categoryId,
  );

  const startPlacing = () => {
    setSelectedPoiId(null);
    setIsPlacing(true);
  };

  const handlePlace = (location: Position) => {
    setIsPlacing(false);
    setFormTarget({ mode: 'create', location });
  };

  const confirmDelete = (poi: PoiFeature) => {
    modals.openConfirmModal({
      title: 'Delete POI',
      children: <Text size="sm">Delete “{poi.properties.name}”? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deletePoi.mutate(poi.properties.id, { onSuccess: () => setSelectedPoiId(null) }),
    });
  };

  return (
    // The header is 56px; dvh keeps this correct as mobile browser chrome collapses.
    <Box pos="relative" h="calc(100dvh - 56px)" w="100%">
      <MapProvider>
        <PoiLayers
          features={features}
          categories={categories}
          activeCategoryIds={activeCategoryIds}
          selectedPoiId={selectedPoiId}
          onSelect={setSelectedPoiId}
          interactive={!isPlacing}
        />
        <PoiPlacement active={isPlacing} onPlace={handlePlace} />
      </MapProvider>

      {!isMapConfigured && (
        <Center pos="absolute" inset={0} p="md">
          <Alert
            icon={<IconAlertTriangle />}
            title="Map tiles are not configured"
            color="yellow"
            maw={480}
          >
            Set <code>VITE_MAPTILER_KEY</code> in the <code>.env</code> file at the repository root,
            then restart the dev server.
          </Alert>
        </Center>
      )}

      {isMapConfigured && (
        <>
          {/* The right offset keeps the bar clear of the navigation controls. */}
          <Box pos="absolute" top={8} left={8} right={56} style={{ zIndex: 1 }}>
            <PoiFilterBar
              categories={categories}
              activeCategoryIds={activeCategoryIds}
              onChange={setActiveCategoryIds}
            />
          </Box>

          {isPlacing && (
            <Paper
              pos="absolute"
              top={64}
              left="50%"
              p="xs"
              radius="md"
              shadow="md"
              withBorder
              style={{ zIndex: 2, transform: 'translateX(-50%)' }}
            >
              <Group gap="sm" wrap="nowrap">
                <Text size="sm">Click the map to place the POI</Text>
                <Button size="compact-xs" variant="default" onClick={() => setIsPlacing(false)}>
                  Cancel
                </Button>
              </Group>
            </Paper>
          )}

          {!isPlacing && (
            <Button
              pos="absolute"
              bottom={16}
              right={16}
              radius="xl"
              leftSection={<IconMapPinPlus size={18} />}
              onClick={startPlacing}
              style={{ zIndex: 1 }}
            >
              Add POI
            </Button>
          )}

          {poisQuery.isPending && (
            <Paper pos="absolute" bottom={72} right={16} p="xs" radius="md" style={{ zIndex: 1 }}>
              <Loader size="sm" />
            </Paper>
          )}

          {poisQuery.isError && (
            <Alert
              pos="absolute"
              bottom={16}
              left={16}
              maw={360}
              icon={<IconAlertTriangle />}
              title="Could not load POIs"
              color="red"
              style={{ zIndex: 1 }}
            >
              {poisQuery.error.message}
            </Alert>
          )}

          {selectedPoi && (
            <PoiDetailSheet
              poi={selectedPoi}
              category={selectedCategory}
              onClose={() => setSelectedPoiId(null)}
              onEdit={() => setFormTarget({ mode: 'edit', poi: selectedPoi })}
              onDelete={() => confirmDelete(selectedPoi)}
            />
          )}
        </>
      )}

      {formTarget && (
        <PoiFormModal
          categories={categories}
          poi={formTarget.mode === 'edit' ? formTarget.poi : null}
          initialLocation={formTarget.mode === 'create' ? formTarget.location : null}
          onClose={() => setFormTarget(null)}
          onSaved={(poi) => setSelectedPoiId(poi.properties.id)}
        />
      )}
    </Box>
  );
}
