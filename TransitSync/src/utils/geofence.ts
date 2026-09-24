// src/utils/geofence.ts
// Pure JS geofencing using the Haversine formula — no native module required.

export const OFFICE_LOCATION = {
  latitude: 23.0677813,
  longitude: 72.5519712,
  name: "TransitSync Central Hub",
};

export const USER_LOCATION = {
  latitude: 23.0677813,
  longitude: 72.5519712,
};

export const GEOFENCE_RADIUS_METERS = 200;

/**
 * Calculates the distance in metres between two coordinates using the
 * Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Returns true if the user coordinate lies within GEOFENCE_RADIUS_METERS (200m) of the office/depot.
 */
export const isInsideGeofence = (
  user: { latitude: number; longitude: number },
  office = OFFICE_LOCATION,
  radiusMeters = GEOFENCE_RADIUS_METERS,
): boolean => {
  const distance = haversineDistance(
    user.latitude,
    user.longitude,
    office.latitude,
    office.longitude,
  );
  return distance <= radiusMeters;
};
