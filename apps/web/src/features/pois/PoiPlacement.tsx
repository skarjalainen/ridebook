import { useEffect, useRef } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import type { Position } from '@ridebook/shared';
import { useMap } from '../map/MapContext';

interface PoiPlacementProps {
  active: boolean;
  onPlace: (position: Position) => void;
}

/** While active, the next click on the map picks the location for a new POI. */
export function PoiPlacement({ active, onPlace }: PoiPlacementProps) {
  const { map } = useMap();

  const onPlaceRef = useRef(onPlace);
  useEffect(() => {
    onPlaceRef.current = onPlace;
  }, [onPlace]);

  useEffect(() => {
    if (!map || !active) return;

    const canvas = map.getCanvas();
    canvas.style.cursor = 'crosshair';

    const place = (event: MapMouseEvent) => {
      onPlaceRef.current([event.lngLat.lng, event.lngLat.lat]);
    };

    map.on('click', place);

    return () => {
      map.off('click', place);
      canvas.style.cursor = '';
    };
  }, [map, active]);

  return null;
}
