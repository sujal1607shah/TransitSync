import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  RefreshControl,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import AttendanceStatusCard from "../components/AttendanceStatusCard";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import useTripStore from "../store/TripStore";
import useVehicleStore from "../store/VehicleStore";
import useDriverStore from "../store/DriverStore";
import client from "../api/axiosClient";
import { AdminDashboardUrl, DispatcherDashboardUrl, DriverDashboardUrl } from "../api/apiPath";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { trips, getTrips } = useTripStore();
  const { vehicles, getVehicles } = useVehicleStore();
  const { drivers, getDrivers } = useDriverStore();

  const userRole = user?.role || "ROLE_DRIVER";

  const [refreshing, setRefreshing] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<any>({
    totalVehicles: 0,
    activeVehicles: 0,
    vehiclesOnTrip: 0,
    availableVehicles: 0,
    todayTrips: 0,
    completedTrips: 0,
    incidents: 0,
    maintenanceDue: 0,
    utilization: "0%",
  });

  // Dispatcher Modal State
  const [selectedTripModal, setSelectedTripModal] = useState(false);
  const [assignDriverModal, setAssignDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("Rohit Sharma");
  const [activeFilter, setActiveFilter] = useState("All");

  const loadLiveDashboardData = async () => {
    try {
      await Promise.all([getTrips(), getVehicles(), getDrivers()]);

      if (userRole === "ROLE_ADMIN" || userRole === "ADMIN") {
        const res = await client.get(AdminDashboardUrl);
        if (res.data?.data) {
          setAdminMetrics(res.data.data);
        }
      } else if (userRole === "ROLE_DISPATCHER" || userRole === "DISPATCHER") {
        await client.get(DispatcherDashboardUrl);
      } else {
        await client.get(DriverDashboardUrl);
      }
    } catch (e) {
      console.log("Live dashboard fetch notice:", e);
    }
  };

  useEffect(() => {
    loadLiveDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveDashboardData();
    setRefreshing(false);
  };

  // Derive active trip or fallback
  const activeTrip = trips.find((t) => t.status === "DISPATCHED" || t.status === "ON TRIP") || trips[0] || {
    tripID: "--",
    source: "--",
    destination: "--",
  };

  return (
    <ScreenWrapper title={userRole === "ROLE_DISPATCHER" ? "Live Operations" : userRole === "ROLE_ADMIN" ? "Admin Console" : "Driver Home"}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={authColors.roleAccent} />
        }
      >
        {/* ================= DRIVER HOME VIEW ================= */}
        {(userRole === "ROLE_DRIVER" || userRole === "DRIVER") && (
          <View style={styles.driverSection}>
            {/* Driver Profile Header Card */}
            <View style={styles.driverHeaderCard}>
              <View style={styles.driverHeaderLeft}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverAvatarText}>
                    {user?.name?.[0]?.toUpperCase() || "A"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.driverGreeting}>Good Morning,</Text>
                  <Text style={styles.driverName}>{user?.name || "Alex Driver"}</Text>
                </View>
              </View>
              <View style={styles.dutyBadge}>
                <Text style={styles.dutyBadgeText}>On Duty</Text>
              </View>
            </View>

            {/* Automated Geofence Attendance Card */}
            <AttendanceStatusCard />

            {/* Today's Trip Card */}
            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripTitle}>Today's Active Trip</Text>
                <Text style={styles.tripId}>TRIP #{activeTrip.tripID}</Text>
              </View>

              <View style={styles.timelineRow}>
                <View style={styles.timelineDotGreen} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLocation}>{activeTrip.source}</Text>
                  <Text style={styles.timelineTime}>08:30 AM</Text>
                </View>
              </View>

              <View style={styles.timelineLine} />

              <View style={styles.timelineRow}>
                <View style={styles.timelineDotBlue} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLocation}>{activeTrip.destination}</Text>
                  <Text style={styles.timelineTime}>11:15 AM</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate("DriverNavigation")}
              >
                <Text style={styles.primaryBtnText}>View Route & Navigation</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Action Grid */}
            <Text style={styles.sectionHeading}>Quick Services</Text>
            <View style={styles.gridContainer}>
              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("Vehicles")}
              >
                <Text style={styles.gridIcon}>🚚</Text>
                <Text style={styles.gridLabel}>My Vehicle</Text>
                <Text style={styles.gridSub}>{vehicles?.[0]?.registrationNumber || "No Vehicle Assigned"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("TeamChat")}
              >
                <Text style={styles.gridIcon}>💬</Text>
                <Text style={styles.gridLabel}>Messages</Text>
                <Text style={styles.gridBadge}>3 new</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("Attendance")}
              >
                <Text style={styles.gridIcon}>⚠️</Text>
                <Text style={styles.gridLabel}>Report Issue</Text>
                <Text style={styles.gridSub}>Mess It Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridCard}
                onPress={() => navigation.navigate("Dispatch")}
              >
                <Text style={styles.gridIcon}>📋</Text>
                <Text style={styles.gridLabel}>My Trips</Text>
                <Text style={styles.gridSub}>{trips.length} Total Trips</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= DISPATCHER LIVE MAP VIEW ================= */}
        {(userRole === "ROLE_DISPATCHER" || userRole === "DISPATCHER") && (
          <View style={styles.dispatcherSection}>
            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {["All", "Available", "On Trip", "Idle", "Delayed"].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.filterChip, activeFilter === chip && styles.filterChipActive]}
                  onPress={() => setActiveFilter(chip)}
                >
                  <Text style={[styles.filterChipText, activeFilter === chip && styles.filterChipTextActive]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Rich Vector Live Operations Map Canvas */}
            <View style={styles.mapContainer}>
              <View style={styles.mapCanvasBg}>
                {/* Map Header */}
                <View style={styles.mapCanvasHeader}>
                  <View style={styles.mapStatusPulse}>
                    <View style={styles.mapStatusDot} />
                    <Text style={styles.mapCanvasTitle}>Ahmedabad Fleet Corridor Live Map</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.expandMapBtn}
                    onPress={() => navigation.navigate("DriverNavigation")}
                  >
                    <Text style={styles.expandMapText}>Fullscreen ⛶</Text>
                  </TouchableOpacity>
                </View>

                {/* Road Grid Overlay */}
                <View style={styles.roadHorizontal1} />
                <View style={styles.roadHorizontal2} />
                <View style={styles.roadVertical1} />
                <View style={styles.roadVertical2} />
                <View style={styles.routePolyline} />

                {/* Location Labels */}
                <Text style={[styles.areaLabel, { top: 25, left: 16 }]}>📍 SG Highway</Text>
                <Text style={[styles.areaLabel, { bottom: 20, right: 20 }]}>🏭 Changodar Depot</Text>

                {/* Simulated Vehicle Pins */}
                <TouchableOpacity
                  style={[styles.mapPinCard, { top: 60, left: 40 }]}
                  onPress={() => setSelectedTripModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pinBadgeActive}>
                    <Text style={styles.pinIcon}>🚛</Text>
                    <Text style={styles.pinTextActive}>{activeTrip.tripID} (On Trip)</Text>
                  </View>
                  <Text style={styles.pinSubText}>ETA 11:15 • Alex Driver</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapPinCard, { bottom: 45, right: 35 }]}
                  onPress={() => setSelectedTripModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pinBadgeAvail}>
                    <Text style={styles.pinIcon}>🚚</Text>
                    <Text style={styles.pinTextAvail}>GJ01CD5678 (Available)</Text>
                  </View>
                  <Text style={styles.pinSubText}>Standby • 2.1 km away</Text>
                </TouchableOpacity>

                {/* Map Controls */}
                <View style={styles.mapControls}>
                  <TouchableOpacity style={styles.mapCtrlBtn}><Text style={styles.mapCtrlText}>+</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.mapCtrlBtn}><Text style={styles.mapCtrlText}>−</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.mapCtrlBtn}><Text style={styles.mapCtrlText}>🎯</Text></TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Active Trips Cards */}
            <View style={styles.activeTripsHeader}>
              <Text style={styles.sectionHeading}>Active Trips ({trips.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Dispatch")}>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.tripSummaryCard}
              onPress={() => setSelectedTripModal(true)}
            >
              <View style={styles.tripSummaryRow}>
                <View>
                  <Text style={styles.tripSummaryId}>{activeTrip.tripID}</Text>
                  <Text style={styles.tripSummaryRoute}>{activeTrip.source} → {activeTrip.destination}</Text>
                </View>
                <View style={styles.statusOnTrip}>
                  <Text style={styles.statusOnTripText}>{activeTrip.status || "Scheduled"}</Text>
                </View>
              </View>
              <View style={styles.driverRow}>
                <Text style={styles.driverInfoText}>👤 Alex Driver • GJ01AB1234</Text>
                <Text style={styles.driverEtaText}>ETA 11:15 AM</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= ADMIN DASHBOARD VIEW ================= */}
        {(userRole === "ROLE_ADMIN" || userRole === "ADMIN") && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionHeading}>Fleet Overview</Text>

            {/* Overview Stat Metrics Grid */}
            <View style={styles.adminGrid}>
              <View style={styles.adminCard}>
                <Text style={styles.adminCardIcon}>🚚</Text>
                <Text style={styles.adminCardNum}>{vehicles.length}</Text>
                <Text style={styles.adminCardLabel}>Total Vehicles</Text>
              </View>

              <View style={[styles.adminCard, { borderColor: "rgba(16, 185, 129, 0.4)" }]}>
                <Text style={styles.adminCardIcon}>🟢</Text>
                <Text style={[styles.adminCardNum, { color: "#10B981" }]}>{adminMetrics.activeVehicles}</Text>
                <Text style={styles.adminCardLabel}>Active Vehicles</Text>
              </View>

              <View style={styles.adminCard}>
                <Text style={styles.adminCardIcon}>🛣️</Text>
                <Text style={styles.adminCardNum}>{trips.filter(t => t.status === "DISPATCHED" || t.status === "ON TRIP").length}</Text>
                <Text style={styles.adminCardLabel}>On Trip</Text>
              </View>

              <View style={styles.adminCard}>
                <Text style={styles.adminCardIcon}>🅿️</Text>
                <Text style={styles.adminCardNum}>{adminMetrics.availableVehicles}</Text>
                <Text style={styles.adminCardLabel}>Available</Text>
              </View>
            </View>

            <Text style={styles.sectionHeading}>Today's Operations</Text>
            <View style={styles.adminGrid}>
              <View style={styles.adminCard}>
                <Text style={styles.adminCardNum}>{trips.length}</Text>
                <Text style={styles.adminCardLabel}>Today's Trips</Text>
              </View>
              <View style={styles.adminCard}>
                <Text style={[styles.adminCardNum, { color: authColors.roleAccent }]}>{adminMetrics.utilization}</Text>
                <Text style={styles.adminCardLabel}>Fleet Utilization</Text>
              </View>
              <View style={[styles.adminCard, { borderColor: "rgba(239, 68, 68, 0.4)" }]}>
                <Text style={[styles.adminCardNum, { color: "#EF4444" }]}>{adminMetrics.incidents}</Text>
                <Text style={styles.adminCardLabel}>Incidents</Text>
              </View>
              <View style={[styles.adminCard, { borderColor: "rgba(245, 158, 11, 0.4)" }]}>
                <Text style={[styles.adminCardNum, { color: "#F59E0B" }]}>{adminMetrics.maintenanceDue}</Text>
                <Text style={styles.adminCardLabel}>Maintenance Due</Text>
              </View>
            </View>

            {/* Quick Links */}
            <View style={styles.quickLinksRow}>
              <TouchableOpacity
                style={styles.quickLinkBtn}
                onPress={() => navigation.navigate("Vehicles")}
              >
                <Text style={styles.quickLinkText}>🚚 Fleet Management</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLinkBtn}
                onPress={() => navigation.navigate("Settings")}
              >
                <Text style={styles.quickLinkText}>📋 Dispatchers & Org</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Trip Details Modal for Dispatcher */}
      <Modal visible={selectedTripModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Trip Details - {activeTrip.tripID}</Text>
              <TouchableOpacity onPress={() => setSelectedTripModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Origin</Text>
              <Text style={styles.detailVal}>{activeTrip.source} (08:30 AM)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailVal}>{activeTrip.destination} (11:15 AM)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Driver</Text>
              <Text style={styles.detailVal}>Alex Driver (GJ01AB1234)</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailVal}>{activeTrip.plannedDistance || 0} km</Text>
            </View>

            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                onPress={() => {
                  setSelectedTripModal(false);
                  navigation.navigate("Dispatch");
                }}
              >
                <Text style={styles.primaryBtnText}>Update Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => {
                  setSelectedTripModal(false);
                  setAssignDriverModal(true);
                }}
              >
                <Text style={styles.secondaryBtnText}>Reassign Driver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Driver Bottom Sheet */}
      <Modal visible={assignDriverModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Assign Driver</Text>
              <TouchableOpacity onPress={() => setAssignDriverModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {(drivers.length > 0 ? drivers.map((d) => d.name || d.driverID) : []).map((drv) => (
              <TouchableOpacity
                key={drv}
                style={[styles.driverSelectCard, selectedDriver === drv && styles.driverSelectCardActive]}
                onPress={() => setSelectedDriver(drv)}
              >
                <View>
                  <Text style={styles.driverSelectName}>{drv}</Text>
                  <Text style={styles.driverSelectSub}>Available • 2.1 km away</Text>
                </View>
                <Text style={styles.radioIcon}>{selectedDriver === drv ? "🔘" : "⚪"}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setAssignDriverModal(false)}
            >
              <Text style={styles.primaryBtnText}>Assign Driver ({selectedDriver})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  driverSection: {
    gap: 16,
  },
  driverHeaderCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  driverHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: authColors.roleActiveBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
  },
  driverAvatarText: {
    color: authColors.roleAccent,
    fontSize: 18,
    fontWeight: "700",
  },
  driverGreeting: {
    fontSize: 12,
    color: authColors.textMuted,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  dutyBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  dutyBadgeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  tripCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  tripId: {
    fontSize: 12,
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  timelineDotBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: authColors.roleAccent,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: authColors.cardBorder,
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  timelineLocation: {
    fontSize: 14,
    fontWeight: "600",
    color: authColors.textPrimary,
  },
  timelineTime: {
    fontSize: 12,
    color: authColors.textMuted,
  },
  primaryBtn: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginTop: 8,
    marginBottom: 8,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  gridSub: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  gridBadge: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "700",
    marginTop: 2,
  },
  dispatcherSection: {
    gap: 12,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: authColors.inputBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: authColors.roleAccent,
    borderColor: authColors.roleAccent,
  },
  filterChipText: {
    color: authColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  mapContainer: {
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(37, 99, 235, 0.4)",
    marginBottom: 8,
  },
  mapCanvasBg: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 12,
    position: "relative",
  },
  mapCanvasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  mapStatusPulse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  mapCanvasTitle: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  expandMapBtn: {
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.4)",
  },
  expandMapText: {
    color: authColors.roleAccent,
    fontSize: 10,
    fontWeight: "700",
  },
  roadHorizontal1: {
    position: "absolute",
    top: 90,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "rgba(51, 65, 85, 0.8)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.4)",
  },
  roadHorizontal2: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "rgba(51, 65, 85, 0.8)",
  },
  roadVertical1: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 110,
    width: 14,
    backgroundColor: "rgba(51, 65, 85, 0.8)",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.4)",
  },
  roadVertical2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 120,
    width: 12,
    backgroundColor: "rgba(51, 65, 85, 0.8)",
  },
  routePolyline: {
    position: "absolute",
    top: 95,
    left: 115,
    width: 170,
    height: 3,
    backgroundColor: authColors.roleAccent,
    borderRadius: 2,
    transform: [{ rotate: "25deg" }],
  },
  areaLabel: {
    position: "absolute",
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  mapPinCard: {
    position: "absolute",
    backgroundColor: authColors.cardBg,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1.5,
    borderColor: authColors.roleAccent,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  pinBadgeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinBadgeAvail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinIcon: { fontSize: 14 },
  pinTextActive: { color: authColors.roleAccent, fontSize: 11, fontWeight: "700" },
  pinTextAvail: { color: "#10B981", fontSize: 11, fontWeight: "700" },
  pinSubText: { color: authColors.textMuted, fontSize: 9, marginTop: 1 },
  mapControls: {
    position: "absolute",
    bottom: 12,
    left: 12,
    gap: 4,
  },
  mapCtrlBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: authColors.cardBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  mapCtrlText: { color: authColors.textPrimary, fontWeight: "800", fontSize: 12 },

  activeTripsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  linkText: {
    color: authColors.roleAccent,
    fontSize: 12,
    fontWeight: "600",
  },
  tripSummaryCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginBottom: 20,
  },
  tripSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripSummaryId: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  tripSummaryRoute: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
  },
  statusOnTrip: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusOnTripText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  driverRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
    paddingTop: 10,
  },
  driverInfoText: {
    fontSize: 12,
    color: authColors.textSecondary,
  },
  driverEtaText: {
    fontSize: 12,
    color: authColors.textMuted,
  },
  adminSection: {
    gap: 12,
  },
  adminGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  adminCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: authColors.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  adminCardIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  adminCardNum: {
    fontSize: 22,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  adminCardLabel: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  quickLinksRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  quickLinkBtn: {
    flex: 1,
    backgroundColor: authColors.inputBg,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  quickLinkText: {
    color: authColors.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: authColors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  closeText: {
    fontSize: 18,
    color: authColors.textMuted,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
  },
  detailLabel: {
    fontSize: 13,
    color: authColors.textMuted,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: "600",
    color: authColors.textPrimary,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  secondaryBtn: {
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  secondaryBtnText: {
    color: authColors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  driverSelectCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: authColors.inputBg,
    marginBottom: 8,
  },
  driverSelectCardActive: {
    borderColor: authColors.roleAccent,
    borderWidth: 1,
  },
  driverSelectName: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  driverSelectSub: {
    fontSize: 11,
    color: authColors.textMuted,
  },
  radioIcon: {
    fontSize: 18,
  },
});
