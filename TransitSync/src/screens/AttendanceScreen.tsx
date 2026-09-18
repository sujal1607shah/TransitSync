import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { authColors } from '../colors/colors';
import {
  isInsideGeofence,
  OFFICE_LOCATION,
  USER_LOCATION,
} from '../utils/geofence';

export default function AttendanceScreen() {
  const navigation = useNavigation<any>();
  const present = isInsideGeofence(USER_LOCATION, OFFICE_LOCATION);
  const statusText = present ? 'Present ✓' : 'Absent ✗';
  const statusColor = present ? '#28a745' : '#dc3545';
  const statusBg = present ? '#d4edda' : '#f8d7da';

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={authColors.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <Text style={styles.subLabel}>
            {present
              ? 'You are inside the office geofence.'
              : 'You are outside the office geofence.'}
          </Text>
        </View>

        {/* Office Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>🏢  Office Location</Text>
          <View style={styles.coordRow}>
            <Text style={styles.coordKey}>Latitude</Text>
            <Text style={styles.coordValue}>{OFFICE_LOCATION.latitude}</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordKey}>Longitude</Text>
            <Text style={styles.coordValue}>{OFFICE_LOCATION.longitude}</Text>
          </View>
          <View style={[styles.geofenceCircle, { borderColor: statusColor }]}>
            <Text style={[styles.geofenceCircleText, { color: statusColor }]}>
              Radius: 100 m
            </Text>
          </View>
        </View>

        {/* User Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📍  Your Location</Text>
          <View style={styles.coordRow}>
            <Text style={styles.coordKey}>Latitude</Text>
            <Text style={styles.coordValue}>{USER_LOCATION.latitude}</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordKey}>Longitude</Text>
            <Text style={styles.coordValue}>{USER_LOCATION.longitude}</Text>
          </View>
          <Text style={styles.staticNote}>* Using static demo coordinates</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 22,
    color: authColors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: authColors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: authColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
  },
  subLabel: {
    fontSize: 13,
    color: authColors.textSecondary,
    marginTop: 4,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: authColors.divider,
  },
  coordKey: {
    fontSize: 14,
    color: authColors.textSecondary,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '600',
    color: authColors.textPrimary,
  },
  geofenceCircle: {
    marginTop: 14,
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  geofenceCircleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  staticNote: {
    marginTop: 10,
    fontSize: 12,
    color: authColors.textMuted,
    fontStyle: 'italic',
  },
});

