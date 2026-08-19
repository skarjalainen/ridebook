import { useEffect } from 'react';
import { useMap, type LayerSetup } from './MapContext';

/**
 * Adds sources and layers to the map and re-adds them whenever the style changes.
 * Every layer must go through here, otherwise it vanishes on a light/dark switch.
 */
export function useMapLayers(setup: LayerSetup, deps: unknown[] = []) {
  const { registerLayers } = useMap();

  useEffect(() => {
    return registerLayers(setup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerLayers, ...deps]);
}
