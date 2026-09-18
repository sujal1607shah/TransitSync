import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useTripStore from "../store/TripStore";
import useVehicleStore from "../store/VehicleStore";
import useDriverStore from "../store/DriverStore";
import Loader from "../components/Loader";

export default function TripDispatchScreen() {
  const { trips, getTrips, registerTrip, dispatchTrip, completeTrip, cancelTrip, loading: tripsLoading } = useTripStore();
  const { vehicles, getVehicles } = useVehicleStore();
  const { drivers, getDrivers } = useDriverStore();

  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [activeTripID, setActiveTripID] = useState<string | number | null>(null);
  const [actionType, setActionType] = useState<"COMPLETE" | "CANCEL">("COMPLETE");

  // Create Form State
  const [tripID, setTripID] = useState("");
  const [source, setSource] = useState("Gandhinagar Depot");
  const [destination, setDestination] = useState("Ahmedabad Hub");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoWeight, setCargoWeight] = useState("700");
  const [plannedDistance, setPlannedDistance] = useState("38");
  const [startingOdometer, setStartingOdometer] = useState("0");

  // Complete/Cancel Actions Form State
  const [finalOdometer, setFinalOdometer] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");

  useEffect(() => {
    getTrips();
    getVehicles();
    getDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableVehicles = useMemo(() => {
    return (vehicles || []).filter((v) => v.status === "AVAILABLE" || v.status === "Available");
  }, [vehicles]);

  const availableDrivers = useMemo(() => {
    return (drivers || []).filter((d) => d.driverStatus === "AVAILABLE" || d.status === "AVAILABLE" || d.status === "Available");
  }, [drivers]);

  const handleRegisterTrip = async () => {
    if (!tripID || !source || !destination || !vehicleId || !driverId) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const payload = {
      tripID,
      source,
      destination,
      vehicleID: vehicleId,
      driverID: driverId,
      cargoWeight: Number(cargoWeight) || 0,
      plannedDistance: Number(plannedDistance) || 0,
      startingOdometer: Number(startingOdometer) || 0,
      status: "DRAFT",
    };

    const res = await registerTrip(payload);
    if (res.success) {
      setRegisterModalVisible(false);
      setTripID("");
      setVehicleId("");
      setDriverId("");
      getTrips();
      Alert.alert("Success", "New trip log created as Draft");
    } else {
      Alert.alert("Error", res.message || "Failed to create trip log");
    }
  };

  const handleDispatch = async (id: string | number) => {
    const res = await dispatchTrip(id);
    if (res.success) {
      getTrips();
      Alert.alert("Dispatched", "Trip is now active!");
    } else {
      Alert.alert("Failed", res.message || "Could not dispatch trip");
    }
  };

  const openCompleteModal = (id: string | number, type: "COMPLETE" | "CANCEL") => {
    setActiveTripID(id);
    setActionType(type);
    setFinalOdometer("");
    setFuelConsumed("");
    setCompleteModalVisible(true);
  };

  const handleCompleteOrCancel = async () => {
    if (!finalOdometer || !fuelConsumed) {
      Alert.alert("Error", "Please fill in final odometer reading and fuel consumed");
      return;
    }

    if (!activeTripID) return;

    let res;
    if (actionType === "COMPLETE") {
      res = await completeTrip(activeTripID, Number(finalOdometer), Number(fuelConsumed));
    } else {
      res = await cancelTrip(activeTripID, Number(finalOdometer), Number(fuelConsumed));
    }

    if (res.success) {
      setCompleteModalVisible(false);
      getTrips();
      Alert.alert(
        "Logged",
        actionType === "COMPLETE" ? "Trip marked as Completed!" : "Trip logged as Cancelled"
      );
    } else {
      Alert.alert("Failed", res.message || "Could not log status update");
    }
  };

  const getStatusStyle = (statusStr: string) => {
    switch (statusStr?.toUpperCase()) {
      case "DRAFT":
        return { text: authColors.textSecondary, bg: "rgba(136,145,171,0.12)" };
      case "DISPATCHED":
        return { text: authColors.teal400, bg: "rgba(45,212,191,0.12)" };
      case "COMPLETED":
        return { text: authColors.success, bg: "rgba(16,185,129,0.12)" };
      case "CANCELLED":
        return { text: authColors.error, bg: "rgba(244,63,94,0.12)" };
      default:
        return { text: authColors.textSecondary, bg: "rgba(136,145,171,0.12)" };
    }
  };

  return (
    <ScreenWrapper title="Trip Dispatcher">
      <Loader show={tripsLoading} text="Syncing logs..." />
      <View style={styles.container}>
        {/* Header toolbar */}
        <View style={styles.toolbar}>
          <Text style={styles.heading}>Transit Control Panel</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setRegisterModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Create Trip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listScroll}>
          {trips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No trip records available.</Text>
            </View>
          ) : (
            [...trips].reverse().map((t) => {
              const statusStyle = getStatusStyle(t.status);
              return (
                <View key={t.tripID} style={styles.tripCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.tripId}>#{t.tripID}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {t.status || "DRAFT"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pathRow}>
                    <Text style={styles.pathTitle}>Source</Text>
                    <Text style={styles.pathVal}>{t.source}</Text>
                  </View>
                  <View style={styles.pathRow}>
                    <Text style={styles.pathTitle}>Destination</Text>
                    <Text style={styles.pathVal}>{t.destination}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>Vehicle: {t.vehicleID}</Text>
                    <Text style={styles.detailText}>Driver ID: {t.driverID}</Text>
                  </View>

                  {/* Show final metrics if Completed/Cancelled */}
                  {(t.status === "COMPLETED" || t.status === "CANCELLED") && (
                    <View style={styles.finalMetrics}>
                      <Text style={styles.metricText}>Odo End: {t.finalOdometer} km</Text>
                      <Text style={styles.metricText}>Fuel: {t.fuelConsumed} L</Text>
                    </View>
                  )}

                  {/* Actions based on status */}
                  {t.status === "DRAFT" && (
                    <TouchableOpacity
                      style={styles.actionBtnDispatch}
                      onPress={() => handleDispatch(t.tripID)}
                    >
                      <Text style={styles.actionBtnDispatchText}>🚀 Dispatch Trip</Text>
                    </TouchableOpacity>
                  )}

                  {t.status === "DISPATCHED" && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtnComplete}
                        onPress={() => openCompleteModal(t.tripID, "COMPLETE")}
                      >
                        <Text style={styles.actionBtnCompleteText}>✅ Complete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtnCancel}
                        onPress={() => openCompleteModal(t.tripID, "CANCEL")}
                      >
                        <Text style={styles.actionBtnCancelText}>✕ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Create Trip Form Modal */}
        <Modal
          visible={registerModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setRegisterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Transit Log</Text>
                <TouchableOpacity onPress={() => setRegisterModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll}>
                <Text style={styles.formLabel}>Trip ID (Unique Code) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. TR007"
                  placeholderTextColor={authColors.textMuted}
                  value={tripID}
                  onChangeText={setTripID}
                />

                <Text style={styles.formLabel}>Source Depot *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Gandhinagar Depot"
                  placeholderTextColor={authColors.textMuted}
                  value={source}
                  onChangeText={setSource}
                />

                <Text style={styles.formLabel}>Destination Hub *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Ahmedabad Hub"
                  placeholderTextColor={authColors.textMuted}
                  value={destination}
                  onChangeText={setDestination}
                />

                {/* Dropdown selectors fallback on TextInputs with custom lists or picker styling */}
                <Text style={styles.formLabel}>Assigned Vehicle ID *</Text>
                {availableVehicles.length === 0 ? (
                  <Text style={styles.warningText}>No vehicles currently AVAILABLE. Check registry.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizSelect}>
                    {availableVehicles.map((v) => (
                      <TouchableOpacity
                        key={v.vehicleID}
                        style={[styles.selectChip, vehicleId === v.vehicleID && styles.selectChipActive]}
                        onPress={() => setVehicleId(v.vehicleID)}
                      >
                        <Text style={[styles.chipText, vehicleId === v.vehicleID && styles.chipTextActive]}>
                          {v.vehicleID} ({v.name})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.formLabel}>Assigned Driver ID *</Text>
                {availableDrivers.length === 0 ? (
                  <Text style={styles.warningText}>No drivers currently AVAILABLE. Check registry.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizSelect}>
                    {availableDrivers.map((d) => {
                      const dId = d.driverID || d.id;
                      return (
                        <TouchableOpacity
                          key={dId}
                          style={[styles.selectChip, driverId === dId && styles.selectChipActive]}
                          onPress={() => setDriverId(dId)}
                        >
                          <Text style={[styles.chipText, driverId === dId && styles.chipTextActive]}>
                            {d.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                <View style={styles.twoColumn}>
                  <View style={styles.column}>
                    <Text style={styles.formLabel}>Cargo weight (kg)</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={cargoWeight}
                      onChangeText={setCargoWeight}
                    />
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.formLabel}>Distance (km)</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={plannedDistance}
                      onChangeText={setPlannedDistance}
                    />
                  </View>
                </View>

                <Text style={styles.formLabel}>Starting Odometer (km)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={startingOdometer}
                  onChangeText={setStartingOdometer}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.formCancelBtn}
                    onPress={() => setRegisterModalVisible(false)}
                  >
                    <Text style={styles.formCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.formSaveBtn}
                    onPress={handleRegisterTrip}
                  >
                    <Text style={styles.formSaveBtnText}>Register Trip</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Complete/Cancel Form Modal */}
        <Modal
          visible={completeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCompleteModalVisible(false)}
        >
          <View style={styles.centeredOverlay}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>
                {actionType === "COMPLETE" ? "Complete Transit Log" : "Log Cancelled Trip"}
              </Text>
              <Text style={styles.dialogSubtitle}>
                Provide final trip statistics for metrics calculations.
              </Text>

              <Text style={styles.formLabel}>Final Odometer Reading (km) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 15438"
                placeholderTextColor={authColors.textMuted}
                keyboardType="numeric"
                value={finalOdometer}
                onChangeText={setFinalOdometer}
              />

              <Text style={styles.formLabel}>Fuel Consumed (Liters) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 4.2"
                placeholderTextColor={authColors.textMuted}
                keyboardType="numeric"
                value={fuelConsumed}
                onChangeText={setFuelConsumed}
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setCompleteModalVisible(false)}
                >
                  <Text style={styles.formCancelBtnText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formSaveBtn, actionType === "CANCEL" && { backgroundColor: authColors.error }]}
                  onPress={handleCompleteOrCancel}
                >
                  <Text style={[styles.formSaveBtnText, actionType === "CANCEL" && { color: authColors.textPrimary }]}>
                    Submit Logs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  addButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#1a1200",
    fontSize: 13,
    fontWeight: "700",
  },
  listScroll: {
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    color: authColors.textMuted,
    fontSize: 14,
  },
  tripCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tripId: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  pathRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  pathTitle: {
    fontSize: 11,
    color: authColors.textMuted,
    textTransform: "uppercase",
  },
  pathVal: {
    fontSize: 13,
    color: authColors.textSecondary,
    fontWeight: "600",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: authColors.divider,
    paddingTop: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: authColors.textSecondary,
  },
  finalMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  metricText: {
    fontSize: 12,
    color: authColors.teal400,
    fontWeight: "600",
  },
  actionBtnDispatch: {
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },
  actionBtnDispatchText: {
    color: authColors.roleAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtnComplete: {
    flex: 1,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: authColors.successBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnCompleteText: {
    color: authColors.success,
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnCancel: {
    flex: 1,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderWidth: 1,
    borderColor: authColors.errorBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnCancelText: {
    color: authColors.error,
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: authColors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  modalCloseIcon: {
    fontSize: 20,
    color: authColors.textMuted,
  },
  formScroll: {
    padding: 20,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: authColors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formInput: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: authColors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: authColors.error,
    marginBottom: 16,
    fontWeight: "600",
  },
  horizSelect: {
    flexGrow: 0,
    marginBottom: 16,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginRight: 8,
  },
  selectChipActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: authColors.roleActiveBg,
  },
  chipText: {
    fontSize: 12,
    color: authColors.textSecondary,
  },
  chipTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingBottom: 40,
  },
  formCancelBtn: {
    flex: 1,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  formCancelBtnText: {
    color: authColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  formSaveBtn: {
    flex: 2,
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  formSaveBtnText: {
    color: "#1a1200",
    fontSize: 14,
    fontWeight: "700",
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dialogCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 12,
    color: authColors.textMuted,
    marginBottom: 16,
  },
});
