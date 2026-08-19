import { useCallback, useEffect, useMemo, useRef } from 'react';
import { LngLatBounds } from 'maplibre-gl';
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl';
import { useComputedColorScheme } from '@mantine/core';
import type { PoiCategory, PoiFeature } from '@ridebook/shared';
import { useMap } from '../map/MapContext';
import { useMapLayers } from '../map/useMapLayers';
import { categoryVisual } from './categoryVisuals';

const SOURCE_ID = 'pois';
const HALO_LAYER = 'pois-halo';
const CIRCLE_LAYER = 'pois-circle';
const VISITED_LAYER = 'pois-visited';
const LABEL_LAYER = 'pois-label';

// maplibre-gl does not export the style-spec expression types, so filters are
// assembled as plain arrays and cast where they are handed to the map.
type MapFilter = Parameters<MapLibreMap['setFilter']>[1];
type Predicate = unknown[] | null;

const categoryPredicate = (ids: string[]): Predicate =>
  ids.length > 0 ? ['in', ['get', 'categoryId'], ['literal', ids]] : null;

const allOf = (...predicates: Predicate[]): MapFilter => {
  const active = predicates.filter((predicate): predicate is unknown[] => predicate !== null);
  if (active.length === 0) return null;
  return (active.length === 1 ? active[0] : ['all', ...active]) as MapFilter;
};

interface PoiLayersProps {
  features: PoiFeature[];
  categories: PoiCategory[];
  /** Empty means "no category filter", i.e. show everything. */
  activeCategoryIds: string[];
  selectedPoiId: string | null;
  onSelect: (id: string | null) => void;
  /** Turned off while another tool owns map clicks, such as POI placement. */
  interactive: boolean;
}

export function PoiLayers({
  features,
  categories,
  activeCategoryIds,
  selectedPoiId,
  onSelect,
  interactive,
}: PoiLayersProps) {
  const { map } = useMap();
  const colorScheme = useComputedColorScheme('light');

  // The category colour is resolved here so the paint expressions stay trivial.
  const data = useMemo(() => {
    const slugById = new Map(categories.map((category) => [category.id, category.slug]));

    return {
      type: 'FeatureCollection' as const,
      features: features.map((feature) => ({
        type: 'Feature' as const,
        geometry: feature.geometry,
        properties: {
          id: feature.properties.id,
          categoryId: feature.properties.categoryId,
          name: feature.properties.name,
          visited: feature.properties.visitedAt !== null,
          color: categoryVisual(slugById.get(feature.properties.categoryId)).color,
        },
      })),
    };
  }, [features, categories]);

  const categoryFilter = useMemo(() => categoryPredicate(activeCategoryIds), [activeCategoryIds]);

  const setup = useCallback(
    (instance: MapLibreMap) => {
      const source = instance.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (source) source.setData(data);
      else instance.addSource(SOURCE_ID, { type: 'geojson', data });

      if (!instance.getLayer(HALO_LAYER)) {
        instance.addLayer({
          id: HALO_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 14, 15, 18],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.3,
          },
        });
      }

      if (!instance.getLayer(CIRCLE_LAYER)) {
        instance.addLayer({
          id: CIRCLE_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 5, 10, 7, 15, 10],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }

      // A white pip marks a visited POI (RULE-007: visited when visitedAt is set).
      if (!instance.getLayer(VISITED_LAYER)) {
        instance.addLayer({
          id: VISITED_LAYER,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 1.8, 15, 3.6],
            'circle-color': '#ffffff',
          },
        });
      }

      if (!instance.getLayer(LABEL_LAYER)) {
        instance.addLayer({
          id: LABEL_LAYER,
          type: 'symbol',
          source: SOURCE_ID,
          minzoom: 9,
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 12,
            'text-offset': [0, 1.1],
            'text-anchor': 'top',
            'text-optional': true,
          },
          paint: {
            'text-color': colorScheme === 'dark' ? '#f1f3f5' : '#212529',
            'text-halo-color': colorScheme === 'dark' ? '#1a1b1e' : '#ffffff',
            'text-halo-width': 1.2,
          },
        });
      }

      instance.setFilter(
        HALO_LAYER,
        allOf(categoryFilter, ['==', ['get', 'id'], selectedPoiId ?? '']),
      );
      instance.setFilter(CIRCLE_LAYER, allOf(categoryFilter));
      instance.setFilter(VISITED_LAYER, allOf(categoryFilter, ['==', ['get', 'visited'], true]));
      instance.setFilter(LABEL_LAYER, allOf(categoryFilter));
    },
    [data, categoryFilter, selectedPoiId, colorScheme],
  );

  useMapLayers(setup, [setup]);

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!map || !interactive) return;

    const selectFeature = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id === 'string') onSelectRef.current(id);
    };

    // A click that misses every marker clears the selection.
    const clearSelection = (event: MapMouseEvent) => {
      if (!map.getLayer(CIRCLE_LAYER)) return;
      const hits = map.queryRenderedFeatures(event.point, { layers: [CIRCLE_LAYER] });
      if (hits.length === 0) onSelectRef.current(null);
    };

    const showPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', CIRCLE_LAYER, selectFeature);
    map.on('click', clearSelection);
    map.on('mouseenter', CIRCLE_LAYER, showPointer);
    map.on('mouseleave', CIRCLE_LAYER, hidePointer);

    return () => {
      map.off('click', CIRCLE_LAYER, selectFeature);
      map.off('click', clearSelection);
      map.off('mouseenter', CIRCLE_LAYER, showPointer);
      map.off('mouseleave', CIRCLE_LAYER, hidePointer);
    };
  }, [map, interactive]);

  // Frame the POIs once, the first time any arrive.
  const fittedRef = useRef(false);
  useEffect(() => {
    if (!map || fittedRef.current || features.length === 0) return;
    fittedRef.current = true;

    const bounds = new LngLatBounds();
    for (const feature of features) {
      bounds.extend(feature.geometry.coordinates);
    }
    map.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 0 });
  }, [map, features]);

  return null;
}
