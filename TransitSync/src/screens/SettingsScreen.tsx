import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const [depot, setDepot] = useState("Gandhinagar Depot GJ-4");
  const [currency, setCurrency] = useState("INR (Rs)");
  const [distanceUnit, setDistanceUnit] = useState("Kilometers");

  const handleSave = () => {
    Alert.alert("Settings Updated", "Configuration changes have been saved to local memory.");
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
    <ScreenWrapper title="Settings">
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
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user?.role === "ROLE_DISPATCHER"
                      ? "Dispatcher"
                      : user?.role === "ROLE_ADMIN"
                      ? "Administrator"
                      : "Driver / Team Member"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnIcon}>🚪</Text>
              <Text style={styles.logoutBtnText}>Logout from Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Configuration</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Depot Name</Text>
            <TextInput
              style={styles.input}
              value={depot}
              onChangeText={setDepot}
              placeholder="e.g. Gandhinagar Depot GJ-4"
              placeholderTextColor={authColors.textMuted}
            />

            <Text style={styles.label}>Currency</Text>
            <TextInput
              style={styles.input}
              value={currency}
              onChangeText={setCurrency}
              placeholder="e.g. INR (Rs)"
              placeholderTextColor={authColors.textMuted}
            />

            <Text style={styles.label}>Distance Unit</Text>
            <TextInput
              style={styles.input}
              value={distanceUnit}
              onChangeText={setDistanceUnit}
              placeholder="e.g. Kilometers"
              placeholderTextColor={authColors.textMuted}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RBAC Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role-Based Access (RBAC)</Text>
          <View style={styles.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  {["Role", "Fleet", "Driver", "Trip", "Fuel/Exp", "Analytics"].map((h) => (
                    <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
                  ))}
                </View>

                {ROLES.map((r, idx) => (
                  <View key={r} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, styles.roleName]}>{r}</Text>
                    <Text style={styles.tableCell}>✓</Text>
                    <Text style={styles.tableCell}>View</Text>
                    <Text style={styles.tableCell}>—</Text>
                    <Text style={styles.tableCell}>—</Text>
                    <Text style={styles.tableCell}>✓</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
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
    fontSize: 12,
    fontWeight: "700",
    color: authColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  profileCard: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 16,
    padding: 18,
    gap: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: authColors.roleAccent,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: authColors.textMuted,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  roleBadgeText: {
    color: authColors.roleAccent,
    fontSize: 11,
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  logoutBtnIcon: {
    fontSize: 16,
  },
  logoutBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 16,
    padding: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: authColors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
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
  saveButton: {
    backgroundColor: "rgba(106, 168, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(106, 168, 255, 0.4)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#6aa8ff",
    fontSize: 14,
    fontWeight: "700",
  },
  table: {
    width: 480,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    color: authColors.textMuted,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: authColors.divider,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "rgba(255,255,255,0.01)",
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: authColors.textSecondary,
  },
  roleName: {
    color: authColors.textPrimary,
    fontWeight: "600",
  },
});
