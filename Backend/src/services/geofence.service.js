/**
 * Haversine formula to calculate distance between two lat/lng pairs in meters.
 */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

const GEOFENCE_CONFIG = {
  latitude: 23.0225,
  longitude: 72.5714,
  radiusMeters: 200, // 200 meters allowed radius
};

function verifyGeofence(userLat, userLng) {
  const distance = getDistanceInMeters(
    userLat,
    userLng,
    GEOFENCE_CONFIG.latitude,
    GEOFENCE_CONFIG.longitude
  );

  return {
    isInside: distance <= GEOFENCE_CONFIG.radiusMeters,
    distanceMeters: Math.round(distance),
    allowedRadius: GEOFENCE_CONFIG.radiusMeters,
  };
}

module.exports = {
  getDistanceInMeters,
  verifyGeofence,
  GEOFENCE_CONFIG,
};
