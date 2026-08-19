import { Alert, Box, Center } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { MapProvider } from '../features/map/MapProvider';
import { isMapConfigured } from '../features/map/mapStyles';

export function MapPage() {
  return (
    // The header is 56px; dvh keeps this correct as mobile browser chrome collapses.
    <Box pos="relative" h="calc(100dvh - 56px)" w="100%">
      <MapProvider />
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
    </Box>
  );
}
