import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { authColors } from '../colors/colors';
import { isInsideGeofence, OFFICE_LOCATION } from '../utils/geofence';

// Mock current user location (same as office for demo)
const CURRENT_LOCATION = { latitude: 23.0676832, longitude: 72.5519447 };

const AttendanceStatusCard: React.FC = () => {
  const present = isInsideGeofence(CURRENT_LOCATION, OFFICE_LOCATION);
  const statusText = present ? 'Present' : 'Absent';
  const badgeStyle = present ? styles.presentBadge : styles.absentBadge;
  const badgeTextStyle = present ? styles.presentBadgeText : styles.absentBadgeText;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <View style={[styles.statusBadge, badgeStyle]}>
        <Text style={[styles.statusBadgeText, badgeTextStyle]}>{statusText}</Text>
      </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: authColors.textPrimary,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  presentBadge: {
    backgroundColor: '#d4edda',
  },
  absentBadge: {
    backgroundColor: '#f8d7da',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  presentBadgeText: {
    color: '#155724',
  },
  absentBadgeText: {
    color: '#721c24',
  },
});

export default AttendanceStatusCard;
