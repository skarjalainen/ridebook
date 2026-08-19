import { createContext, useContext } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

export type LayerSetup = (map: MapLibreMap) => void;

export interface MapContextValue {
  map: MapLibreMap | null;
  /**
   * Registers layer setup that must be re-applied after setStyle(), which
   * discards every custom source and layer.
   */
  registerLayers: (setup: LayerSetup) => () => void;
}

export const MapContext = createContext<MapContextValue | null>(null);

export function useMap(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMap must be used inside a MapProvider');
  return context;
}
