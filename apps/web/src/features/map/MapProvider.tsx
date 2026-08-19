import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useComputedColorScheme } from '@mantine/core';
import { MapContext, type LayerSetup, type MapContextValue } from './MapContext';
import { DEFAULT_CENTER, DEFAULT_ZOOM, isMapConfigured, mapStyleUrl } from './mapStyles';

// MapLibre locates its tile-parsing worker relative to its own import.meta.url.
// Both Vite's dependency pre-bundling and the production build move that module,
// so the lookup 404s and tiles silently never load. Point it at the worker that
// Vite bundles for us instead.
setWorkerUrl(maplibreWorkerUrl);

export function MapProvider({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const setupsRef = useRef<Set<LayerSetup>>(new Set());
  const appliedSchemeRef = useRef<string | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  const colorScheme = useComputedColorScheme('light');

  const applySetups = useCallback(() => {
    const instance = mapRef.current;
    if (!instance) return;
    for (const setup of setupsRef.current) setup(instance);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !isMapConfigured) return;

    const instance = new MapLibreMap({
      container: containerRef.current,
      style: mapStyleUrl(colorScheme),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    instance.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    instance.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );
    instance.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');

    mapRef.current = instance;
    appliedSchemeRef.current = colorScheme;

    instance.on('load', () => {
      setMap(instance);
      applySetups();
    });

    return () => {
      instance.remove();
      mapRef.current = null;
      appliedSchemeRef.current = null;
      setMap(null);
    };
    // The map is created once; the colour scheme is handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance || appliedSchemeRef.current === null) return;
    if (appliedSchemeRef.current === colorScheme) return;

    appliedSchemeRef.current = colorScheme;
    instance.setStyle(mapStyleUrl(colorScheme));
    // setStyle discards custom sources and layers, so they must be re-added.
    // 'styledata' fires before the new style is ready and anything added there
    // is discarded again, so wait for 'style.load'.
    instance.once('style.load', applySetups);
  }, [colorScheme, applySetups]);

  const registerLayers = useCallback((setup: LayerSetup) => {
    setupsRef.current.add(setup);

    const instance = mapRef.current;
    if (instance?.isStyleLoaded()) setup(instance);

    return () => {
      setupsRef.current.delete(setup);
    };
  }, []);

  const value = useMemo<MapContextValue>(() => ({ map, registerLayers }), [map, registerLayers]);

  return (
    <MapContext.Provider value={value}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {children}
    </MapContext.Provider>
  );
}
