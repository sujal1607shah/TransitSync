// src/utils/geofence.ts
// Pure JS geofencing using the Haversine formula — no native module required.

export const OFFICE_LOCATION = {
  latitude: 23.0676832,
  longitude: 72.5519447,
};

export const USER_LOCATION = {
  latitude: 23.090619,
  longitude: 72.5519447,
};

const RADIUS_METERS = 100;

/**
 * Calculates the distance in metres between two coordinates using the
 * Haversine formula.
 */
function haversineDistance(
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
  return R * c;
}

/**
 * Returns true if the user coordinate lies within RADIUS_METERS of the office.
 */
export const isInsideGeofence = (
  user: { latitude: number; longitude: number },
  office = OFFICE_LOCATION,
): boolean => {
  const distance = haversineDistance(
    user.latitude,
    user.longitude,
    office.latitude,
    office.longitude,
  );
  return distance <= RADIUS_METERS;
};
