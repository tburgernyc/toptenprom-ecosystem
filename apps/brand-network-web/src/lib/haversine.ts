// ---------------------------------------------------------------------------
// Haversine nearest-store utilities
// Pure TypeScript — no external dependencies.
// All functions are synchronous and safe to call server-side or in tests.
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns the great-circle distance in kilometres between two WGS-84 points.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export interface GeoPoint {
  latitude: string | number | null;
  longitude: string | number | null;
}

export interface LocationWithDistance<T extends GeoPoint> {
  location: T;
  distanceKm: number;
}

/**
 * Sorts an array of location-like objects by ascending distance from the
 * given origin coordinates. Items with null/invalid coordinates are placed
 * at the end of the list.
 */
export function sortByNearest<T extends GeoPoint>(
  originLat: number,
  originLng: number,
  locations: T[]
): LocationWithDistance<T>[] {
  return locations
    .map((location): LocationWithDistance<T> => {
      const lat =
        location.latitude !== null ? Number(location.latitude) : NaN;
      const lng =
        location.longitude !== null ? Number(location.longitude) : NaN;

      const distanceKm =
        isNaN(lat) || isNaN(lng)
          ? Infinity
          : haversineKm(originLat, originLng, lat, lng);

      return { location, distanceKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
