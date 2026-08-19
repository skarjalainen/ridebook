import { useMemo, useState } from 'react';
import { Alert, Box, Center, Loader, Paper } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { MapProvider } from '../features/map/MapProvider';
import { isMapConfigured } from '../features/map/mapStyles';
import { PoiLayers } from '../features/pois/PoiLayers';
import { PoiFilterBar } from '../features/pois/PoiFilterBar';
import { PoiDetailSheet } from '../features/pois/PoiDetailSheet';
import { usePoiCategories, usePois } from '../features/pois/queries';

export function MapPage() {
  const categoriesQuery = usePoiCategories();
  const poisQuery = usePois();

  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const features = useMemo(() => poisQuery.data?.features ?? [], [poisQuery.data]);

  const selectedPoi = features.find((feature) => feature.properties.id === selectedPoiId) ?? null;
  const selectedCategory = categories.find(
    (category) => category.id === selectedPoi?.properties.categoryId,
  );

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
        />
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

          {poisQuery.isPending && (
            <Paper pos="absolute" bottom={16} right={16} p="xs" radius="md" style={{ zIndex: 1 }}>
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
            />
          )}
        </>
      )}
    </Box>
  );
}
