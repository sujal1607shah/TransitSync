import React, { useEffect, useState } from "react";
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
import useVehicleStore from "../store/VehicleStore";
import Loader from "../components/Loader";

export default function VehicleRegistryScreen() {
  const { vehicles, getVehicles, registerVehicle, updateVehicle, deleteVehicle, loading } = useVehicleStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Form State
  const [vehicleID, setVehicleID] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Truck");
  const [maxLoadCapacity, setMaxLoadCapacity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [status, setStatus] = useState("AVAILABLE");

  useEffect(() => {
    getVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearForm = () => {
    setVehicleID("");
    setRegistrationNumber("");
    setName("");
    setType("Truck");
    setMaxLoadCapacity("");
    setOdometer("");
    setAcquisitionCost("");
    setStatus("AVAILABLE");
    setEditingId(null);
  };

  const handleOpenEdit = (v: any) => {
    setEditingId(v.vehicleID);
    setVehicleID(v.vehicleID);
    setRegistrationNumber(v.registrationNumber);
    setName(v.name);
    setType(v.type);
    setMaxLoadCapacity(v.maxLoadCapacity?.toString() || "");
    setOdometer(v.odometer?.toString() || "");
    setAcquisitionCost(v.acquisitionCost?.toString() || "");
    setStatus(v.status || "AVAILABLE");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingId && !vehicleID) {
      Alert.alert("Error", "Vehicle ID is required");
      return;
    }
    if (!registrationNumber || !name || !maxLoadCapacity) {
      Alert.alert("Error", "Please fill in registration, name, and capacity details");
      return;
    }

    const payload = {
      vehicleID,
      registrationNumber,
      name,
      type,
      maxLoadCapacity: Number(maxLoadCapacity),
      odometer: Number(odometer) || 0,
      acquisitionCost: Number(acquisitionCost) || 0,
      status,
    };

    let result;
    if (editingId) {
      result = await updateVehicle(editingId, payload);
    } else {
      result = await registerVehicle(payload);
    }

    if (result.success) {
      setModalVisible(false);
      clearForm();
      getVehicles();
      Alert.alert("Success", editingId ? "Vehicle updated" : "Vehicle registered");
    } else {
      Alert.alert("Error", result.message || "Failed to save vehicle");
    }
  };

  const handleDelete = (id: string | number) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete vehicle ${id}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteVehicle(id);
            if (res.success) {
              Alert.alert("Deleted", "Vehicle deleted successfully");
              getVehicles();
            } else {
              Alert.alert("Failed", res.message || "Could not delete vehicle");
            }
          },
        },
      ]
    );
  };

  const filteredVehicles = (vehicles || []).filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.vehicleID?.toString().toLowerCase().includes(q) ||
      v.registrationNumber?.toLowerCase().includes(q) ||
      v.name?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q)
    );
  });

  const getStatusStyle = (vStatus: string) => {
    switch (vStatus?.toUpperCase()) {
      case "AVAILABLE":
        return { text: authColors.success, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" };
      case "MAINTENANCE":
      case "IN_SHOP":
        return { text: authColors.error, bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.3)" };
      case "ON_TRIP":
      case "ON TRIP":
        return { text: authColors.teal400, bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.3)" };
      default:
        return { text: authColors.textSecondary, bg: "rgba(136,145,171,0.12)", border: "rgba(136,145,171,0.3)" };
    }
  };

  return (
    <ScreenWrapper title="Vehicle Registry">
      <Loader show={loading} text="Updating registry..." />
      <View style={styles.container}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search registration, name, type..."
            placeholderTextColor={authColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              clearForm();
              setModalVisible(true);
            }}
          >
            <Text style={styles.addButtonText}>+ New Vehicle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollList}>
          {filteredVehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No registered vehicles found.</Text>
            </View>
          ) : (
            filteredVehicles.map((v) => {
              const statusStyle = getStatusStyle(v.status);
              return (
                <View key={v.vehicleID} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.vehicleName}>{v.name}</Text>
                      <Text style={styles.vehiclePlate}>{v.registrationNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {v.status || "AVAILABLE"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardGrid}>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>ID</Text>
                      <Text style={styles.cellVal}>{v.vehicleID}</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>Type</Text>
                      <Text style={styles.cellVal}>{v.type}</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>Load Capacity</Text>
                      <Text style={styles.cellVal}>{v.maxLoadCapacity} kg</Text>
                    </View>
                    <View style={styles.gridCell}>
                      <Text style={styles.cellLabel}>Odometer</Text>
                      <Text style={styles.cellVal}>{v.odometer} km</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtnEdit}
                      onPress={() => handleOpenEdit(v)}
                    >
                      <Text style={styles.actionBtnText}>Edit Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      onPress={() => handleDelete(v.vehicleID)}
                    >
                      <Text style={styles.actionBtnTextDelete}>De-register</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Create/Edit Vehicle Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? "Update Vehicle" : "Register Vehicle"}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll}>
                {/* Vehicle ID (read-only when editing) */}
                <Text style={styles.formLabel}>Vehicle ID (Unique Code) *</Text>
                <TextInput
                  style={[styles.formInput, editingId ? styles.disabledInput : {}]}
                  placeholder="e.g. TRK-12"
                  placeholderTextColor={authColors.textMuted}
                  editable={!editingId}
                  value={vehicleID}
                  onChangeText={setVehicleID}
                />

                {/* Registration Number */}
                <Text style={styles.formLabel}>Registration Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. GJ-01-XX-9999"
                  placeholderTextColor={authColors.textMuted}
                  autoCapitalize="characters"
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                />

                {/* Vehicle Name */}
                <Text style={styles.formLabel}>Model / Nickname *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Tata Ultra T.7"
                  placeholderTextColor={authColors.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                {/* Type Selection */}
                <Text style={styles.formLabel}>Vehicle Type *</Text>
                <View style={styles.pickerRow}>
                  {["Truck", "Van", "Mini"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.pickerBtn,
                        type === t && styles.pickerBtnActive,
                      ]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.pickerBtnText, type === t && styles.pickerBtnTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Load Capacity */}
                <Text style={styles.formLabel}>Max Load Capacity (kg) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 5000"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={maxLoadCapacity}
                  onChangeText={setMaxLoadCapacity}
                />

                {/* Odometer */}
                <Text style={styles.formLabel}>Starting Odometer (km)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 15400"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={odometer}
                  onChangeText={setOdometer}
                />

                {/* Acquisition Cost */}
                <Text style={styles.formLabel}>Acquisition Cost (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 1500000"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={acquisitionCost}
                  onChangeText={setAcquisitionCost}
                />

                {/* Status Selection */}
                <Text style={styles.formLabel}>Operation Status *</Text>
                <View style={styles.pickerRow}>
                  {["AVAILABLE", "ON_TRIP", "MAINTENANCE"].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.pickerBtn,
                        status === s && styles.pickerBtnActive,
                      ]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[styles.pickerBtnText, status === s && styles.pickerBtnTextActive]}>
                        {s.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Submit / Cancel Buttons */}
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.formCancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.formCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.formSaveBtn}
                    onPress={handleSave}
                  >
                    <Text style={styles.formSaveBtnText}>Save Vehicle</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    gap: 8,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: authColors.textPrimary,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#1a1200",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollList: {
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
  card: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  vehiclePlate: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: authColors.divider,
    paddingTop: 12,
    marginBottom: 16,
    gap: 12,
  },
  gridCell: {
    width: "45%",
  },
  cellLabel: {
    fontSize: 10,
    color: authColors.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cellVal: {
    fontSize: 13,
    fontWeight: "600",
    color: authColors.textSecondary,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtnEdit: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    color: authColors.textPrimary,
    fontWeight: "600",
  },
  actionBtnDelete: {
    flex: 1,
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnTextDelete: {
    fontSize: 13,
    color: authColors.deleteText,
    fontWeight: "600",
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
  disabledInput: {
    opacity: 0.5,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pickerBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    backgroundColor: authColors.inputBg,
  },
  pickerBtnActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: authColors.roleActiveBg,
  },
  pickerBtnText: {
    fontSize: 12,
    color: authColors.textSecondary,
    fontWeight: "500",
  },
  pickerBtnTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
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
});
