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
  const { drivers, getDrivers, createDriver, deleteDriver, loading: driversLoading } = useDriverStore();
  const { user, loading: signupLoading } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const isAdminOrDispatcher =
    user?.role === "ROLE_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "ROLE_DISPATCHER" ||
    user?.role === "DISPATCHER";

  // Add Driver Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [license, setLicense] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/YYYY

  useEffect(() => {
    getDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setContact("");
    setLicense("");
    setExpiry("");
  };

  const handleInvite = async () => {
    if (!name || !contact || !license || !expiry) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const trimmedExpiry = expiry.trim();
    let licenseExpiryDate = "";

    // Support MM/YYYY, DD/MM/YYYY, YYYY-MM-DD, or direct Date strings
    if (trimmedExpiry.includes("/")) {
      const parts = trimmedExpiry.split("/");
      if (parts.length === 2) {
        // MM/YYYY
        const mm = Number(parts[0]);
        const yyyy = Number(parts[1]);
        if (isNaN(mm) || isNaN(yyyy) || mm < 1 || mm > 12 || yyyy < 2000 || yyyy > 2100) {
          Alert.alert("Error", "Invalid Expiry date. Please use MM/YYYY (e.g. 12/2028)");
          return;
        }
        licenseExpiryDate = new Date(yyyy, mm - 1, 1).toISOString();
      } else if (parts.length === 3) {
        // DD/MM/YYYY
        const dd = Number(parts[0]);
        const mm = Number(parts[1]);
        const yyyy = Number(parts[2]);
        if (isNaN(dd) || isNaN(mm) || isNaN(yyyy) || mm < 1 || mm > 12 || yyyy < 2000) {
          Alert.alert("Error", "Invalid Expiry date format. Use MM/YYYY or DD/MM/YYYY");
          return;
        }
        licenseExpiryDate = new Date(yyyy, mm - 1, dd).toISOString();
      } else {
        Alert.alert("Error", "Invalid Expiry date format. Use MM/YYYY (e.g. 12/2028)");
        return;
      }
    } else if (trimmedExpiry.includes("-")) {
      const parsedDate = new Date(trimmedExpiry);
      if (isNaN(parsedDate.getTime())) {
        Alert.alert("Error", "Invalid Expiry date format.");
        return;
      }
      licenseExpiryDate = parsedDate.toISOString();
    } else {
      Alert.alert("Error", "Invalid Expiry date. Please use MM/YYYY format (e.g. 12/2028)");
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sanitizedEmail = email && email.trim()
      ? email.trim().toLowerCase()
      : `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${randomSuffix}@fleet.com`;

    const payload = {
      name: name.trim(),
      email: sanitizedEmail,
      password: password && password.trim() ? password.trim() : "DriverPassword123!",
      phoneNo: contact.trim(),
      licenseNo: license.trim(),
      licenseExpiryDate: licenseExpiryDate,
      role: "ROLE_DRIVER",
      driverStatus: "AVAILABLE",
      safetyScore: 100,
    };

    const res = await createDriver(payload);
    if (res.success) {
      setModalVisible(false);
      clearForm();
      getDrivers();
      Alert.alert("Success", "Driver profile created and added to registry!");
    } else {
      Alert.alert("Failed", res.message || "Could not register driver");
    }
  };

  const handleDeleteDriver = (driverItem: any) => {
    const idToDelete = driverItem.id || driverItem._id || driverItem.user;
    const driverName = driverItem.name || "this driver";

    if (!idToDelete) {
      Alert.alert("Error", "Driver ID not identified.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${driverName}? This action will remove the driver account and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteDriver(idToDelete);
            if (res.success) {
              Alert.alert("Deleted", `${driverName} has been removed from the registry.`);
              getDrivers();
            } else {
              Alert.alert("Delete Failed", res.message || "Could not delete driver");
            }
          },
        },
      ]
    );
  };

  const isLicenseExpired = (expiryStr: string) => {
    if (!expiryStr) return false;
    try {
      const parts = expiryStr.split("/");
      if (parts.length === 2) {
        const mm = Number(parts[0]);
        let yyyy = Number(parts[1]);
        if (yyyy < 100) yyyy += 2000;
        const endOfMonth = new Date(yyyy, mm, 0, 23, 59, 59);
        return endOfMonth < new Date();
      }
      const expDate = new Date(expiryStr);
      if (isNaN(expDate.getTime())) return false;
      return expDate < new Date();
    } catch {
      return false;
    }
  };

  const formatExpiry = (expiryStr: string) => {
    if (!expiryStr) return "--";
    try {
      const parts = expiryStr.split("/");
      if (parts.length === 2) {
        return expiryStr;
      }
      const date = new Date(expiryStr);
      if (isNaN(date.getTime())) return expiryStr;
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${mm}/${yyyy}`;
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
      d.licenseNumber?.toLowerCase().includes(q) ||
      d.phoneNo?.toLowerCase().includes(q) ||
      d.phone?.toLowerCase().includes(q) ||
      d.driverID?.toLowerCase().includes(q) ||
      d.driverId?.toLowerCase().includes(q)
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
        <View style={styles.headerRow}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="Search driver, license, phone..."
              placeholderTextColor={authColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              clearForm();
              setModalVisible(true);
            }}
            activeOpacity={0.8}
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
              const dId = d.driverID || d.driverId || d.id || d._id;
              const isSelected = selectedId === dId;
              const isExpired = isLicenseExpired(d.licenseExpiryDate || d.licenseExpiry);
              const statusStyle = getStatusStyle(d.driverStatus || d.status);
              const driverPhone = d.phoneNo || d.phone || d.contact || "--";
              const driverLicense = d.licenseNo || d.licenseNumber || d.license || "--";
              const driverExpiry = d.licenseExpiryDate || d.licenseExpiry;
              
              const initials = (d.name || "D")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <View key={dId} style={[styles.card, isSelected && styles.cardActive]}>
                  {/* Top Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.driverProfileMeta}>
                      <View style={styles.driverAvatar}>
                        <Text style={styles.driverAvatarText}>{initials}</Text>
                      </View>
                      <View style={styles.driverIdentity}>
                        <View style={styles.nameBadgeRow}>
                          <Text style={styles.driverName} numberOfLines={1}>{d.name}</Text>
                          <Text style={styles.driverCodeBadge}>{d.driverID || d.driverId || "DRV"}</Text>
                        </View>
                        <Text style={styles.driverPhone}>📞 {driverPhone}</Text>
                      </View>
                    </View>

                    <View style={styles.headerRightActions}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                          {d.driverStatus || d.status || "AVAILABLE"}
                        </Text>
                      </View>
                      {isAdminOrDispatcher && (
                        <TouchableOpacity
                          style={styles.deleteDriverBtn}
                          onPress={() => handleDeleteDriver(d)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.deleteDriverBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* License Info Bar */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>🪪 LICENSE NO</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>{driverLicense}</Text>
                    </View>

                    <View style={styles.detailDivider} />

                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>📅 VALIDITY</Text>
                      <Text style={[styles.detailValue, isExpired && { color: authColors.error, fontWeight: "700" }]}>
                        {formatExpiry(driverExpiry)}
                        {isExpired && " (Expired)"}
                      </Text>
                    </View>
                  </View>

                  {/* Driver Stats Footer */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricIcon}>🛡️</Text>
                      <View>
                        <Text style={styles.metricLabel}>Safety Score</Text>
                        <Text style={styles.metricValSafety}>
                          {d.safetyScore !== undefined ? d.safetyScore : d.safety || 100}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metricItem}>
                      <Text style={styles.metricIcon}>🚚</Text>
                      <View>
                        <Text style={styles.metricLabel}>Completed Trips</Text>
                        <Text style={styles.metricVal}>
                          {d.tripsCompleted !== undefined ? d.tripsCompleted : d.trips || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
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
                  placeholder="e.g. Rajesh Kumar"
                  placeholderTextColor={authColors.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.formLabel}>Email (Optional - auto-generated if empty)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. rajesh@fleet.com"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={styles.formLabel}>Password (Optional - default: DriverPassword123!)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Leave empty for default"
                  placeholderTextColor={authColors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <Text style={styles.formLabel}>Contact Phone *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="phone-pad"
                  value={contact}
                  onChangeText={setContact}
                />

                <Text style={styles.formLabel}>Driving License Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. GJ-01-2024-88992"
                  placeholderTextColor={authColors.textMuted}
                  autoCapitalize="characters"
                  value={license}
                  onChangeText={setLicense}
                />

                <Text style={styles.formLabel}>License Expiry (MM/YYYY) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="MM/YYYY (e.g. 12/2028)"
                  placeholderTextColor={authColors.textMuted}
                  value={expiry}
                  onChangeText={setExpiry}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  activeOpacity={0.8}
                  onPress={handleInvite}
                >
                  <Text style={styles.submitButtonText}>Confirm & Add Driver</Text>
                </TouchableOpacity>
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
  headerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchBar: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    color: authColors.textPrimary,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: authColors.roleAccent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  scrollList: {
    paddingBottom: 80,
    gap: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: authColors.textMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: authColors.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: authColors.border,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardActive: {
    borderColor: authColors.roleAccent,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverProfileMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1.5,
    borderColor: authColors.roleAccent,
    justifyContent: "center",
    alignItems: "center",
  },
  driverAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: authColors.roleAccent,
  },
  driverIdentity: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  driverCodeBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: authColors.textMuted,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  driverPhone: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  deleteDriverBtn: {
    backgroundColor: "rgba(244,63,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.25)",
    borderRadius: 10,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteDriverBtnText: {
    fontSize: 15,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailBlock: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    height: 28,
    backgroundColor: authColors.border,
    marginHorizontal: 12,
  },
  detailLabel: {
    fontSize: 10,
    color: authColors.textMuted,
    marginBottom: 2,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    color: authColors.textPrimary,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 10,
    borderRadius: 12,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricLabel: {
    fontSize: 11,
    color: authColors.textMuted,
    fontWeight: "500",
  },
  metricValSafety: {
    fontSize: 15,
    fontWeight: "800",
    color: authColors.success,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: authColors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: authColors.border,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  modalCloseIcon: {
    fontSize: 20,
    color: authColors.textMuted,
    padding: 4,
  },
  formScroll: {
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: authColors.textMuted,
    marginBottom: 6,
    marginTop: 6,
  },
  formInput: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: authColors.textPrimary,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
});
