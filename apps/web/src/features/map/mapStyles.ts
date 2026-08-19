/** MapTiler style URLs. Swapping these is the whole of the light/dark map theme. */
const STYLE_IDS = {
  light: 'streets-v2',
  dark: 'streets-v2-dark',
} as const;

export type MapColorScheme = keyof typeof STYLE_IDS;

export const maptilerKey = import.meta.env.VITE_MAPTILER_KEY ?? '';

export const isMapConfigured = maptilerKey.length > 0;

export function mapStyleUrl(scheme: MapColorScheme): string {
  return `https://api.maptiler.com/maps/${STYLE_IDS[scheme]}/style.json?key=${maptilerKey}`;
}

/** Southern Finland, a reasonable default until the map has data to fit. */
export const DEFAULT_CENTER: [number, number] = [24.94, 60.17];
export const DEFAULT_ZOOM = 8;
