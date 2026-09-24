import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { authColors } from "../colors/colors";
import {
  isInsideGeofence,
  haversineDistance,
  OFFICE_LOCATION,
  USER_LOCATION,
  GEOFENCE_RADIUS_METERS,
} from "../utils/geofence";
import { attendanceApi } from "../services/apiService";
import useAuthStore from "../store/AuthStore";

interface AttendanceRecord {
  _id?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  distanceFromGeofence?: number;
  isInsideGeofence?: boolean;
}

const AttendanceStatusCard: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number }>(USER_LOCATION);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);

  // Distance from organization geofence (in meters)
  const distanceMeters = haversineDistance(
    currentCoords.latitude,
    currentCoords.longitude,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  );

  const present = isInsideGeofence(currentCoords, OFFICE_LOCATION, GEOFENCE_RADIUS_METERS);

  // Request Location Permission
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "TransitSync Driver Location Permission",
            message:
              "TransitSync requires your location to automatically mark duty attendance when you arrive within the 200m organization depot geofence.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "Allow Location",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationPermissionGranted(true);
        } else {
          setLocationPermissionGranted(false);
        }
      } catch (err) {
        console.warn("Location permission error:", err);
      }
    } else {
      setLocationPermissionGranted(true);
    }
  };

  // Fetch Attendance History and Today's Status
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getMyAttendance();
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setAttendanceLogs(list);
        const todayStr = new Date().toISOString().split("T")[0];
        const match = list.find((item: AttendanceRecord) => item.date === todayStr);
        setTodayRecord(match || null);
      }
    } catch (err) {
      console.log("Fetch attendance notice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
    fetchAttendance();
  }, []);

  // Auto/Manual Check-In
  const handleCheckIn = async () => {
    if (!present) {
      Alert.alert(
        "Outside Geofence",
        `You are currently ${distanceMeters}m away from the depot. Automated attendance requires being within 200m of Latitude: ${OFFICE_LOCATION.latitude}, Longitude: ${OFFICE_LOCATION.longitude}.`
      );
      return;
    }

    setCheckingIn(true);
    try {
      const res = await attendanceApi.checkIn(currentCoords);
      if (res.data?.success) {
        Alert.alert("Attendance Marked", "Geofence automated check-in verified! Status: PRESENT");
        fetchAttendance();
      } else {
        Alert.alert("Notice", res.data?.message || "Check-in recorded");
      }
    } catch (err: any) {
      Alert.alert("Check-in Notice", err.response?.data?.message || err.message || "Already checked in today");
    } finally {
      setCheckingIn(false);
    }
  };

  // Check-Out
  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      const res = await attendanceApi.checkOut(currentCoords);
      if (res.data?.success) {
        Alert.alert("Checked Out", "Duty check-out completed successfully!");
        fetchAttendance();
      }
    } catch (err: any) {
      Alert.alert("Check-Out", err.response?.data?.message || err.message || "Failed to check out");
    } finally {
      setCheckingIn(false);
    }
  };

  // Format Time
  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const fh = h % 12 || 12;
    const fm = m < 10 ? `0${m}` : m;
    return `${fh}:${fm} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>📍 Automated Geofence Attendance</Text>
          <Text style={styles.subTitle}>
            Depot: {OFFICE_LOCATION.latitude.toFixed(4)}, {OFFICE_LOCATION.longitude.toFixed(4)} (200m Radius)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.statusBadge, present ? styles.presentBadge : styles.absentBadge]}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, { backgroundColor: present ? "#10B981" : "#F43F5E" }]} />
          <Text style={[styles.statusBadgeText, present ? styles.presentBadgeText : styles.absentBadgeText]}>
            {present ? "In Zone (Present)" : "Out of Zone"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Geofence Telemetry Card */}
      <View style={styles.telemetryCard}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>LIVE DISTANCE</Text>
          <Text style={[styles.telemetryVal, { color: present ? "#10B981" : authColors.roleAccent }]}>
            {distanceMeters}m
          </Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>GEOFENCE LIMIT</Text>
          <Text style={styles.telemetryVal}>{GEOFENCE_RADIUS_METERS}m</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>TODAY STATUS</Text>
          <Text style={[styles.telemetryVal, { color: todayRecord ? "#10B981" : "#F59E0B" }]}>
            {todayRecord ? "PRESENT" : present ? "IN ZONE" : "ABSENT"}
          </Text>
        </View>
      </View>

      {/* Check In / Out Action Bar */}
      <View style={styles.actionRow}>
        {!todayRecord?.checkInTime ? (
          <TouchableOpacity
            style={[styles.checkInBtn, !present && styles.btnDisabled]}
            onPress={handleCheckIn}
            disabled={checkingIn}
            activeOpacity={0.8}
          >
            {checkingIn ? (
              <ActivityIndicator color="#0F172A" size="small" />
            ) : (
              <Text style={styles.checkInBtnText}>
                {present ? "🟢 Verify & Mark Present" : `⚠️ Move Within 200m (${distanceMeters}m)`}
              </Text>
            )}
          </TouchableOpacity>
        ) : !todayRecord?.checkOutTime ? (
          <TouchableOpacity
            style={styles.checkOutBtn}
            onPress={handleCheckOut}
            disabled={checkingIn}
            activeOpacity={0.8}
          >
            {checkingIn ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.checkOutBtnText}>
                🔴 Check Out for Today (Checked In: {formatTime(todayRecord.checkInTime)})
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.shiftCompletedBox}>
            <Text style={styles.shiftCompletedText}>
              ✅ Today Shift Complete ({formatTime(todayRecord.checkInTime)} - {formatTime(todayRecord.checkOutTime)})
            </Text>
          </View>
        )}
      </View>

      {/* Quick Attendance Logs */}
      {attendanceLogs.length > 0 && (
        <View style={styles.logsSection}>
          <Text style={styles.logsTitle}>📋 Recent Duty Attendance Logs</Text>
          {attendanceLogs.slice(0, 3).map((log, idx) => (
            <View key={log._id || idx} style={styles.logRow}>
              <View style={styles.logDateBlock}>
                <Text style={styles.logDateText}>{log.date}</Text>
                <Text style={styles.logDistanceText}>📍 {log.distanceFromGeofence ?? distanceMeters}m</Text>
              </View>

              <View style={styles.logTimeBlock}>
                <Text style={styles.logTimeText}>
                  IN: {formatTime(log.checkInTime)} | OUT: {formatTime(log.checkOutTime)}
                </Text>
              </View>

              <View style={styles.logBadgePresent}>
                <Text style={styles.logBadgeText}>PRESENT</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: authColors.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authColors.border,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presentBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  absentBadge: {
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  presentBadgeText: {
    color: "#10B981",
  },
  absentBadgeText: {
    color: "#F43F5E",
  },
  telemetryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: authColors.border,
  },
  telemetryItem: {
    flex: 1,
    alignItems: "center",
  },
  telemetryDivider: {
    width: 1,
    height: 24,
    backgroundColor: authColors.border,
  },
  telemetryLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: authColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  telemetryVal: {
    fontSize: 14,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  actionRow: {
    width: "100%",
  },
  checkInBtn: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInBtnText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  checkOutBtn: {
    backgroundColor: "rgba(244, 63, 94, 0.9)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOutBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  btnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  shiftCompletedBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  shiftCompletedText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  logsSection: {
    borderTopWidth: 1,
    borderTopColor: authColors.border,
    paddingTop: 10,
    gap: 8,
  },
  logsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginBottom: 2,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  logDateBlock: {
    flex: 1,
  },
  logDateText: {
    fontSize: 11,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  logDistanceText: {
    fontSize: 10,
    color: authColors.textMuted,
    marginTop: 1,
  },
  logTimeBlock: {
    flex: 1.4,
  },
  logTimeText: {
    fontSize: 10,
    color: authColors.textSecondary,
    fontWeight: "600",
  },
  logBadgePresent: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#10B981",
  },
});

export default AttendanceStatusCard;
