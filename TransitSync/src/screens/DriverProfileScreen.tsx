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
import useDriverStore from "../store/DriverStore";
import useAuthStore from "../store/AuthStore";
import Loader from "../components/Loader";

export default function DriverProfileScreen() {
  const { drivers, getDrivers, loading: driversLoading } = useDriverStore();
  const { signup, loading: signupLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  // Add Driver Form State
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [license, setLicense] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/YYYY

  useEffect(() => {
    getDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearForm = () => {
    setName("");
    setContact("");
    setLicense("");
    setExpiry("");
  };

  const handleInvite = async () => {
    if (!name || !contact || !license || !expiry) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const parts = expiry.split("/");
    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 4) {
      Alert.alert("Error", "Invalid Expiry date. Please use MM/YYYY format.");
      return;
    }

    const mm = Number(parts[0]);
    const yyyy = Number(parts[1]);
    if (mm < 1 || mm > 12) {
      Alert.alert("Error", "Month must be between 01 and 12");
      return;
    }
    const licenseExpiryDate = new Date(yyyy, mm - 1, 1).toISOString();

    const payload = {
      name: name.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, "")}@fleet.com`,
      password: "DriverPassword123!",
      phoneNo: contact.trim(),
      licenseNo: license.trim(),
      licenseExpiryDate: licenseExpiryDate,
      role: "ROLE_DRIVER",
      driverStatus: "AVAILABLE",
      safetyScore: 100,
    };

    const res = await signup(payload);
    if (res.success) {
      setModalVisible(false);
      clearForm();
      getDrivers();
      Alert.alert("Success", "Driver profile created and added to registry!");
    } else {
      Alert.alert("Failed", res.message || "Could not register driver");
    }
  };

  const isLicenseExpired = (expiryStr: string) => {
    if (!expiryStr) return false;
    try {
      const parts = expiryStr.split("/");
      if (parts.length === 2) {
        const mm = Number(parts[0]);
        const yyyy = Number(parts[1]);
        const endOfMonth = new Date(yyyy, mm, 0, 23, 59, 59);
        return endOfMonth < new Date();
      }
      const expDate = new Date(expiryStr);
      return expDate < new Date();
    } catch {
      return false;
    }
  };

  const formatExpiry = (expiryStr: string) => {
    if (!expiryStr) return "--";
    try {
      const d = new Date(expiryStr);
      if (isNaN(d.getTime())) return expiryStr;
      return d.toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" });
    } catch {
      return expiryStr;
    }
  };

  const filteredDrivers = (drivers || []).filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name?.toLowerCase().includes(q) ||
      d.licenseNo?.toLowerCase().includes(q) ||
      d.phoneNo?.toLowerCase().includes(q)
    );
  });

  const getStatusStyle = (dStatus: string) => {
    switch (dStatus?.toUpperCase()) {
      case "AVAILABLE":
        return { text: authColors.success, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" };
      case "ON_TRIP":
      case "ON TRIP":
        return { text: authColors.teal400, bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.3)" };
      case "OFF_DUTY":
      case "OFF DUTY":
        return { text: authColors.textSecondary, bg: "rgba(136,145,171,0.12)", border: "rgba(136,145,171,0.3)" };
      case "SUSPENDED":
        return { text: authColors.error, bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.3)" };
      default:
        return { text: authColors.success, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" };
    }
  };


  return (
    <ScreenWrapper title="Drivers Profiles">
      <Loader show={driversLoading || signupLoading} text="Updating drivers registry..." />
      <View style={styles.container}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search driver name, license, contact..."
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
            <Text style={styles.addButtonText}>+ Add Driver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollList}>
          {filteredDrivers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No driver profiles registered.</Text>
            </View>
          ) : (
            filteredDrivers.map((d) => {
              const dId = d.driverID || d.id;
              const isSelected = selectedId === dId;
              const isExpired = isLicenseExpired(d.licenseExpiryDate);
              const statusStyle = getStatusStyle(d.driverStatus || d.status);
              
              return (
                <TouchableOpacity
                  key={dId}
                  activeOpacity={0.9}
                  style={[styles.card, isSelected && styles.cardActive]}
                  onPress={() => setSelectedId(isSelected ? null : dId)}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.driverName}>{d.name}</Text>
                      <Text style={styles.driverPhone}>{d.phoneNo || d.contact}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {d.driverStatus || d.status || "AVAILABLE"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>License No</Text>
                      <Text style={styles.detailValue}>{d.licenseNo || d.license || "--"}</Text>
                    </View>

                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>License Expiry</Text>
                      <Text style={[styles.detailValue, isExpired && { color: authColors.error }]}>
                        {formatExpiry(d.licenseExpiryDate)}
                        {isExpired && " (Expired)"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Safety Score</Text>
                      <Text style={styles.metricValSafety}>
                        {d.safetyScore !== undefined ? d.safetyScore : d.safety || 100}%
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Trips Done</Text>
                      <Text style={styles.metricVal}>
                        {d.tripsCompleted !== undefined ? d.tripsCompleted : d.trips || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Add Driver Dialog Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Invite Driver Profile</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScroll}>
                <Text style={styles.formLabel}>Driver's Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Alex Mercer"
                  placeholderTextColor={authColors.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.formLabel}>Contact Phone Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. +91 9876543210"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="phone-pad"
                  value={contact}
                  onChangeText={setContact}
                />

                <Text style={styles.formLabel}>Driver License Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. DL-142022009876"
                  placeholderTextColor={authColors.textMuted}
                  autoCapitalize="characters"
                  value={license}
                  onChangeText={setLicense}
                />

                <Text style={styles.formLabel}>License Expiry Date (MM/YYYY) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 10/2032"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={expiry}
                  onChangeText={setExpiry}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.formCancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.formCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.formSaveBtn}
                    onPress={handleInvite}
                  >
                    <Text style={styles.formSaveBtnText}>Register Driver</Text>
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
  cardActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: "rgba(255, 176, 32, 0.02)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  driverPhone: {
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
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: authColors.divider,
  },
  detailBlock: {
    width: "48%",
  },
  detailLabel: {
    fontSize: 9,
    color: authColors.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: authColors.textSecondary,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: authColors.textMuted,
  },
  metricValSafety: {
    fontSize: 13,
    fontWeight: "700",
    color: authColors.teal400,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: "700",
    color: authColors.textSecondary,
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
