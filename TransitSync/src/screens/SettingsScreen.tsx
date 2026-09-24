import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import axios from "../api/axiosClient";
import { OrganizationMeUrl, GetDrivers } from "../api/apiPath";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, organization, logout, createStaffUser } = useAuthStore();

  const [orgData, setOrgData] = useState<any>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);

  // Dispatchers state
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [loadingDispatchers, setLoadingDispatchers] = useState(false);
  const [dispatcherModalVisible, setDispatcherModalVisible] = useState(false);
  const [creatingDispatcher, setCreatingDispatcher] = useState(false);

  // New Dispatcher form state
  const [dispName, setDispName] = useState("");
  const [dispEmail, setDispEmail] = useState("");
  const [dispPassword, setDispPassword] = useState("");
  const [dispPhone, setDispPhone] = useState("");

  // Editable fields
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [depot, setDepot] = useState("Central Depot");
  const [latitude, setLatitude] = useState("23.0225");
  const [longitude, setLongitude] = useState("72.5714");
  const [radiusMeters, setRadiusMeters] = useState("200");
  const [currency, setCurrency] = useState("INR (Rs)");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const isAdmin = user?.role === "ROLE_ADMIN" || user?.role === "ADMIN";

  const fetchOrganizationDetails = async () => {
    setLoadingOrg(true);
    try {
      const res = await axios.get(OrganizationMeUrl);
      if (res.data?.data) {
        const o = res.data.data;
        setOrgData(o);
        setOrgName(o.name || "");
        setOrgCode(o.code || "");
        setCurrency(o.currency || "INR (Rs)");
        setTimezone(o.timezone || "Asia/Kolkata");
        if (o.geofence) {
          setDepot(o.geofence.name || "Central Depot");
          setLatitude(String(o.geofence.latitude || 23.0225));
          setLongitude(String(o.geofence.longitude || 72.5714));
          setRadiusMeters(String(o.geofence.radiusMeters || 200));
        }
      }
    } catch (err) {
      console.log("Org fetch notice:", err);
    }
    setLoadingOrg(false);
  };

  const fetchDispatchers = async () => {
    if (!isAdmin) return;
    setLoadingDispatchers(true);
    try {
      const res = await axios.get(GetDrivers, { params: { role: "ROLE_DISPATCHER" } });
      const list = res.data?.data || res.data || [];
      setDispatchers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log("Dispatchers fetch notice:", err);
    }
    setLoadingDispatchers(false);
  };

  useEffect(() => {
    fetchOrganizationDetails();
    if (isAdmin) {
      fetchDispatchers();
    }
  }, [isAdmin]);

  const handleCreateDispatcher = async () => {
    if (!dispName || !dispEmail) {
      Alert.alert("Validation Error", "Please provide Dispatcher name and email address.");
      return;
    }

    setCreatingDispatcher(true);
    const payload = {
      name: dispName.trim(),
      email: dispEmail.trim().toLowerCase(),
      password: dispPassword && dispPassword.trim() ? dispPassword.trim() : "DispatchPass123!",
      phoneNo: dispPhone.trim(),
      role: "ROLE_DISPATCHER",
    };

    const res = await createStaffUser(payload);
    setCreatingDispatcher(false);

    if (res.success) {
      setDispatcherModalVisible(false);
      setDispName("");
      setDispEmail("");
      setDispPassword("");
      setDispPhone("");
      fetchDispatchers();
      Alert.alert("Success", "Dispatcher created successfully and added to organization!");
    } else {
      Alert.alert("Failed", res.message || "Could not create dispatcher profile");
    }
  };

  const handleDeleteDispatcher = (disp: any) => {
    const dId = disp._id || disp.id;
    const dName = disp.name || "this dispatcher";

    if (!dId) return;

    Alert.alert(
      "Confirm Removal",
      `Are you sure you want to remove dispatcher ${dName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await axios.delete(`${GetDrivers}/${dId}`);
              if (res.data?.success) {
                Alert.alert("Deleted", `${dName} has been removed.`);
                fetchDispatchers();
              } else {
                Alert.alert("Delete Failed", res.data?.message || "Could not delete dispatcher");
              }
            } catch (err: any) {
              Alert.alert("Delete Failed", err.response?.data?.message || err.message || "Could not delete dispatcher");
            }
          },
        },
      ]
    );
  };

  const handleSaveOrg = async () => {
    if (!isAdmin) {
      Alert.alert("Permission Denied", "Only Organization Administrators can update settings.");
      return;
    }

    setSavingOrg(true);
    try {
      const payload = {
        name: orgName,
        currency,
        timezone,
        geofence: {
          name: depot,
          latitude: Number(latitude) || 23.0225,
          longitude: Number(longitude) || 72.5714,
          radiusMeters: Number(radiusMeters) || 200,
        },
      };

      const res = await axios.put(OrganizationMeUrl, payload);
      if (res.data?.success) {
        Alert.alert("Success", "Organization & Geofence profile updated successfully!");
        fetchOrganizationDetails();
      }
    } catch (err: any) {
      Alert.alert("Save Failed", err.response?.data?.message || err.message || "Could not update organization");
    }
    setSavingOrg(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of TransitSync?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper title="Settings & Organization">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* User Profile & Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Session</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || "Demo User"}</Text>
                <Text style={styles.userEmail}>{user?.email || "user@transitsync.com"}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {user?.role === "ROLE_DISPATCHER"
                        ? "Dispatcher"
                        : user?.role === "ROLE_ADMIN"
                        ? "Administrator"
                        : "Driver / Team Member"}
                    </Text>
                  </View>
                  <View style={styles.orgBadge}>
                    <Text style={styles.orgBadgeText}>
                      🏢 {orgCode || organization?.code || "TS-DEMO"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnIcon}>🚪</Text>
              <Text style={styles.logoutBtnText}>Logout from Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-Tenant Organization Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Tenant Organization Profile</Text>
          <View style={styles.card}>
            {loadingOrg ? (
              <ActivityIndicator color={authColors.roleAccent} style={{ padding: 20 }} />
            ) : (
              <>
                <Text style={styles.label}>Organization Name</Text>
                <TextInput
                  style={[styles.input, !isAdmin && styles.inputDisabled]}
                  value={orgName}
                  onChangeText={setOrgName}
                  editable={isAdmin}
                  placeholder="e.g. Metro Freight Logistics"
                  placeholderTextColor={authColors.textMuted}
                />

                <Text style={styles.label}>Organization Code (Permanent Ownership Key)</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={orgCode}
                  editable={false}
                  placeholder="e.g. MTR001"
                  placeholderTextColor={authColors.textMuted}
                />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Currency</Text>
                    <TextInput
                      style={[styles.input, !isAdmin && styles.inputDisabled]}
                      value={currency}
                      onChangeText={setCurrency}
                      editable={isAdmin}
                      placeholder="INR (Rs)"
                      placeholderTextColor={authColors.textMuted}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Timezone</Text>
                    <TextInput
                      style={[styles.input, !isAdmin && styles.inputDisabled]}
                      value={timezone}
                      onChangeText={setTimezone}
                      editable={isAdmin}
                      placeholder="Asia/Kolkata"
                      placeholderTextColor={authColors.textMuted}
                    />
                  </View>
                </View>

                {/* Geofence Depot Configuration */}
                <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>📍 Central Depot & Geofence</Text>
                <Text style={styles.label}>Depot / Hub Name</Text>
                <TextInput
                  style={[styles.input, !isAdmin && styles.inputDisabled]}
                  value={depot}
                  onChangeText={setDepot}
                  editable={isAdmin}
                  placeholder="Central Depot"
                  placeholderTextColor={authColors.textMuted}
                />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Latitude</Text>
                    <TextInput
                      style={[styles.input, !isAdmin && styles.inputDisabled]}
                      value={latitude}
                      onChangeText={setLatitude}
                      editable={isAdmin}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Longitude</Text>
                    <TextInput
                      style={[styles.input, !isAdmin && styles.inputDisabled]}
                      value={longitude}
                      onChangeText={setLongitude}
                      editable={isAdmin}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Radius (m)</Text>
                    <TextInput
                      style={[styles.input, !isAdmin && styles.inputDisabled]}
                      value={radiusMeters}
                      onChangeText={setRadiusMeters}
                      editable={isAdmin}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {isAdmin && (
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveOrg}
                    disabled={savingOrg}
                  >
                    {savingOrg ? (
                      <ActivityIndicator color="#0F172A" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Organization Settings</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Admin Only: Dispatcher Management Section */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>📋 Dispatcher Management</Text>
                <Text style={styles.sectionCaption}>Provision and oversee dispatchers</Text>
              </View>
              <TouchableOpacity
                style={styles.addDispatcherBtn}
                onPress={() => {
                  setDispName("");
                  setDispEmail("");
                  setDispPassword("");
                  setDispPhone("");
                  setDispatcherModalVisible(true);
                }}
              >
                <Text style={styles.addDispatcherBtnText}>+ Add Dispatcher</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {loadingDispatchers ? (
                <ActivityIndicator color={authColors.roleAccent} style={{ padding: 20 }} />
              ) : dispatchers.length === 0 ? (
                <View style={styles.emptyDispatchersBox}>
                  <Text style={styles.emptyDispatchersIcon}>📋</Text>
                  <Text style={styles.emptyDispatchersTitle}>No Dispatchers Created Yet</Text>
                  <Text style={styles.emptyDispatchersSub}>
                    Create your organization's first dispatcher to manage routes, fleets, and assignments.
                  </Text>
                  <TouchableOpacity
                    style={styles.createFirstDispBtn}
                    onPress={() => setDispatcherModalVisible(true)}
                  >
                    <Text style={styles.createFirstDispBtnText}>Create Dispatcher</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.dispatcherList}>
                  {dispatchers.map((disp, idx) => {
                    const dId = disp._id || disp.id || idx;
                    return (
                      <View key={dId} style={[styles.dispatcherItem, idx > 0 && styles.dispatcherItemBorder]}>
                        <View style={styles.dispAvatar}>
                          <Text style={styles.dispAvatarText}>{disp.name?.[0]?.toUpperCase() || "D"}</Text>
                        </View>
                        <View style={styles.dispInfo}>
                          <Text style={styles.dispName}>{disp.name}</Text>
                          <Text style={styles.dispEmail}>{disp.email}</Text>
                          {disp.phone ? <Text style={styles.dispPhone}>📞 {disp.phone}</Text> : null}
                        </View>
                        <View style={styles.dispRoleBadge}>
                          <Text style={styles.dispRoleText}>Dispatcher</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteDispBtn}
                          onPress={() => handleDeleteDispatcher(disp)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.deleteDispBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* RBAC Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tenant Role-Based Access (RBAC)</Text>
          <View style={styles.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  {["Role", "Fleet", "Driver", "Trip", "Fuel/Exp", "Analytics"].map((h, i) => (
                    <Text key={h} style={[styles.tableHeaderCell, i === 0 && styles.tableHeaderCellRole]}>
                      {h}
                    </Text>
                  ))}
                </View>

                {ROLES.map((r, idx) => (
                  <View key={r} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, styles.roleName]}>{r}</Text>
                    <Text style={styles.tableCell}>✓ (Org)</Text>
                    <Text style={styles.tableCell}>View (Org)</Text>
                    <Text style={styles.tableCell}>—</Text>
                    <Text style={styles.tableCell}>—</Text>
                    <Text style={styles.tableCell}>✓ (Org)</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Add Dispatcher Modal Dialog */}
      <Modal
        visible={dispatcherModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDispatcherModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📋</Text>
                <Text style={styles.modalTitle}>Create New Dispatcher</Text>
              </View>
              <TouchableOpacity onPress={() => setDispatcherModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <Text style={styles.formNotice}>
                Only Administrators can provision Dispatcher accounts in this organization.
              </Text>

              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sara Torres"
                placeholderTextColor={authColors.textMuted}
                value={dispName}
                onChangeText={setDispName}
              />

              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. sara.dispatch@transitsync.com"
                placeholderTextColor={authColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={dispEmail}
                onChangeText={setDispEmail}
              />

              <Text style={styles.label}>Password (Optional - default: DispatchPass123!)</Text>
              <TextInput
                style={styles.input}
                placeholder="Leave blank for default password"
                placeholderTextColor={authColors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                value={dispPassword}
                onChangeText={setDispPassword}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={authColors.textMuted}
                keyboardType="phone-pad"
                value={dispPhone}
                onChangeText={setDispPhone}
              />

              <TouchableOpacity
                style={styles.createDispSubmitBtn}
                onPress={handleCreateDispatcher}
                disabled={creatingDispatcher}
              >
                {creatingDispatcher ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.createDispSubmitBtnText}>Create Dispatcher Account</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: authColors.roleAccent,
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: authColors.border,
    gap: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: authColors.roleActiveBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: authColors.roleAccent,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: authColors.roleAccent,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: authColors.textMuted,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: authColors.roleActiveBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  orgBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orgBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: authColors.success,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: authColors.errorBg,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  logoutBtnIcon: {
    fontSize: 16,
  },
  logoutBtnText: {
    color: authColors.error,
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: authColors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: authColors.textMuted,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: authColors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: authColors.textPrimary,
    fontSize: 14,
    marginBottom: 10,
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: "rgba(30,41,59,0.5)",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  table: {
    minWidth: 540,
    paddingRight: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: authColors.border,
    paddingBottom: 8,
    marginBottom: 6,
  },
  tableHeaderCell: {
    width: 80,
    fontSize: 12,
    fontWeight: "700",
    color: authColors.roleAccent,
    textAlign: "center",
  },
  tableHeaderCellRole: {
    width: 140,
    textAlign: "left",
    paddingLeft: 6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 6,
  },
  tableRowAlt: {
    backgroundColor: "rgba(30,41,59,0.04)",
  },
  tableCell: {
    width: 80,
    fontSize: 12,
    color: authColors.textMuted,
    textAlign: "center",
  },
  roleName: {
    width: 140,
    color: authColors.textPrimary,
    fontWeight: "600",
    textAlign: "left",
    paddingLeft: 6,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  sectionTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  sectionCaption: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
  },
  addDispatcherBtn: {
    backgroundColor: authColors.roleAccent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  addDispatcherBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyDispatchersBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyDispatchersIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyDispatchersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  emptyDispatchersSub: {
    fontSize: 12,
    color: authColors.textMuted,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  createFirstDispBtn: {
    backgroundColor: authColors.roleAccent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createFirstDispBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 13,
  },
  dispatcherList: {
    gap: 12,
  },
  dispatcherItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  dispatcherItemBorder: {
    borderTopWidth: 1,
    borderTopColor: authColors.border,
    paddingTop: 12,
  },
  dispAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleAccent,
    justifyContent: "center",
    alignItems: "center",
  },
  dispAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  dispInfo: {
    flex: 1,
  },
  dispName: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  dispEmail: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
  },
  dispPhone: {
    fontSize: 11,
    color: authColors.textSecondary,
    marginTop: 2,
  },
  dispRoleBadge: {
    backgroundColor: authColors.roleActiveBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: authColors.roleAccent,
  },
  deleteDispBtn: {
    backgroundColor: "rgba(244,63,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteDispBtnText: {
    fontSize: 14,
  },
  dispRoleText: {
    fontSize: 11,
    fontWeight: "700",
    color: authColors.roleAccent,
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
    fontSize: 17,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  modalCloseIcon: {
    fontSize: 20,
    color: authColors.textMuted,
    padding: 4,
  },
  formScroll: {
    gap: 8,
  },
  formNotice: {
    fontSize: 12,
    color: authColors.textMuted,
    backgroundColor: "rgba(37,99,235,0.08)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: authColors.roleAccent,
  },
  createDispSubmitBtn: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  createDispSubmitBtnText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
});
