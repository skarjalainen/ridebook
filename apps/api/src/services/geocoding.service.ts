import type { GeocodingResult } from '@ridebook/shared';
import { env } from '../config/env.js';
import { HttpError } from '../lib/errors.js';

export interface GeocodingService {
  /** `near` is [longitude, latitude] and only biases ranking, it does not filter. */
  search(text: string, limit: number, near?: readonly [number, number]): Promise<GeocodingResult[]>;
}

const REQUEST_TIMEOUT_MS = 10_000;

interface PhotonFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

/** Photon has no single label field, so one is composed from the place hierarchy. */
const toLabel = (properties: NonNullable<PhotonFeature['properties']>): string | null => {
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  const primary = properties.name ?? (street || null);
  if (!primary) return null;

  // A search often returns several places with the same name in the same town
  // (village, marina, viewpoint), so the OSM type is what tells them apart.
  const kind = properties.osm_value?.replaceAll('_', ' ');
  const head = kind && kind !== primary.toLowerCase() ? `${primary} (${kind})` : primary;

  const context = [properties.city, properties.state, properties.country].filter(
    (part): part is string => Boolean(part) && part !== primary,
  );

  return [head, ...context].join(', ');
};

const upstreamFailure = (cause: unknown) => {
  const error = new HttpError(502, 'GEOCODING_FAILED', 'The place search provider is unavailable');
  error.cause = cause;
  return error;
};

/**
 * Photon (komoot), an OpenStreetMap geocoder. It needs no API key, but the base
 * URL stays configurable so it can be self-hosted if fair-use becomes a problem.
 */
class PhotonGeocoding implements GeocodingService {
  constructor(private readonly baseUrl: string) {}

  async search(
    text: string,
    limit: number,
    near?: readonly [number, number],
  ): Promise<GeocodingResult[]> {
    const url = new URL('/api', this.baseUrl);
    url.searchParams.set('q', text);
    url.searchParams.set('limit', String(limit));
    if (near) {
      url.searchParams.set('lon', String(near[0]));
      url.searchParams.set('lat', String(near[1]));
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Ridebook/0.1' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (cause) {
      throw upstreamFailure(cause);
    }

    if (!response.ok) {
      throw upstreamFailure(new Error(`Provider responded with ${response.status}`));
    }

    const body = (await response.json()) as { features?: PhotonFeature[] };
    const results: GeocodingResult[] = [];
    // Photon often returns one place several times, once per OSM object. Nearby
    // places can legitimately share a label, so position is part of the key.
    const seen = new Set<string>();

    for (const feature of body.features ?? []) {
      const [longitude, latitude] = feature.geometry?.coordinates ?? [];
      const properties = feature.properties;
      if (longitude === undefined || latitude === undefined || !properties) continue;

      const label = toLabel(properties);
      if (!label) continue;

      const key = `${label}@${longitude.toFixed(4)},${latitude.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        id: `${properties.osm_type ?? 'x'}${properties.osm_id ?? label}`,
        label,
        position: [longitude, latitude],
        country: properties.country ?? null,
        region: properties.state ?? null,
      });
    }

    return results;
  }
}

export const geocodingService: GeocodingService = new PhotonGeocoding(env.PHOTON_BASE_URL);
