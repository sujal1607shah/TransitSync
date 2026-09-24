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

const DEFAULT_GEOFENCE_CONFIG = {
  latitude: 23.0677813,
  longitude: 72.5519712,
  radiusMeters: 200, // 200 meters allowed radius
};

function verifyGeofence(userLat, userLng, customGeofence) {
  const config = customGeofence || DEFAULT_GEOFENCE_CONFIG;
  const radius = config.radiusMeters || 200;

  const distance = getDistanceInMeters(
    userLat,
    userLng,
    config.latitude,
    config.longitude
  );

  return {
    isInside: distance <= radius,
    distanceMeters: Math.round(distance),
    allowedRadius: radius,
  };
}

module.exports = {
  getDistanceInMeters,
  verifyGeofence,
  DEFAULT_GEOFENCE_CONFIG,
};
