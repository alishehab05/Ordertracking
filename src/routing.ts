import type { TrackingPoint } from './components/LeafletTrackingMap';

type GeoJsonLineString = { type: 'LineString'; coordinates: [number, number][] };
type OsrmResponse = {
  code: string;
  routes?: Array<{ geometry?: GeoJsonLineString }>;
};

export type RouteResult = {
  coordinates: [number, number][];
  source: 'osrm' | 'fallback';
  error?: string;
};

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

function isOsrmResponse(value: unknown): value is OsrmResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as { code?: unknown; routes?: unknown };
  return typeof response.code === 'string' && (response.routes === undefined || Array.isArray(response.routes));
}

/* Hawn mnjib tari2 l-shaware3 mn OSRM, mish khat mosta2im ben n2tein. */
export async function fetchStreetRoute(origin: TrackingPoint, destination: TrackingPoint, signal?: AbortSignal): Promise<RouteResult> {
  const coordinates = `${origin.coordinates[1]},${origin.coordinates[0]};${destination.coordinates[1]},${destination.coordinates[0]}`;
  try {
    const response = await fetch(`${OSRM_URL}/${coordinates}?overview=full&geometries=geojson`, { signal });
    if (!response.ok) throw new Error(`Routing service returned ${response.status}.`);
    const payload: unknown = await response.json();
    if (!isOsrmResponse(payload) || payload.code !== 'Ok') throw new Error('No street route was returned.');
    const geometry = payload.routes?.[0]?.geometry;
    if (!geometry || geometry.type !== 'LineString' || geometry.coordinates.length < 2) {
      throw new Error('The street route has no usable geometry.');
    }
    return { coordinates: geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]), source: 'osrm' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    const message = error instanceof Error ? error.message : 'The routing service is unavailable.';
    return { coordinates: [origin.coordinates, destination.coordinates], source: 'fallback', error: message };
  }
}
