import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { authColors } from '../colors/colors';
import { OFFICE_LOCATION, USER_LOCATION } from '../utils/geofence';

const LocationCard: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Office Location</Text>
      <Text style={styles.location}>Latitude: {OFFICE_LOCATION.latitude}</Text>
      <Text style={styles.location}>Longitude: {OFFICE_LOCATION.longitude}</Text>
      <Text style={styles.title}>Current User Location</Text>
      <Text style={styles.location}>Latitude: {USER_LOCATION.latitude}</Text>
      <Text style={styles.location}>Longitude: {USER_LOCATION.longitude}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: authColors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: authColors.textSecondary,
  },
});

export default LocationCard;
