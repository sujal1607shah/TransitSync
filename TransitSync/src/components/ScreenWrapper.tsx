import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import BottomNavBar from "./BottomNavBar";

interface ScreenWrapperProps {
  children: React.ReactNode;
  title: string;
  hideBottomNav?: boolean;
}

export default function ScreenWrapper({
  children,
  title,
  hideBottomNav = false,
}: ScreenWrapperProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, organization, logout } = useAuthStore();
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const handleLogout = async () => {
    setRoleModalVisible(false);
    await logout();
  };

  const handleSwitchRole = async (newRole: string) => {
    setRoleModalVisible(false);
    if (user) {
      user.role = newRole;
    }
    // Refresh current screen to apply role tabs
    navigation.navigate(route.name);
  };

  const userRoleLabel =
    user?.role === "ROLE_DISPATCHER"
      ? "Dispatcher"
      : user?.role === "ROLE_ADMIN"
      ? "Admin"
      : "Driver";

  const orgDisplay = organization?.code || user?.organizationCode || "TS-DEMO";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/ChatGPT Image Aug 23, 2026, 08_28_18 PM.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.headerBrand}>
                Transit<Text style={styles.brandAccent}>Sync</Text>
              </Text>
              <View style={styles.orgBadge}>
                <Text style={styles.orgBadgeText}>{orgDisplay}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>{title}</Text>
          </View>
        </View>

        {/* Role Switcher Pill & Profile */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.roleBadge}
            onPress={() => setRoleModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleBadgeText}>{userRoleLabel} ⚡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.avatarText}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>{children}</View>

      {/* Animated Bottom Navigation Bar */}
      {!hideBottomNav && <BottomNavBar />}

      {/* Role Switcher Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Workspace Role</Text>
            <Text style={styles.modalSubtitle}>
              Current Account: {user?.email}
            </Text>

            <TouchableOpacity
              style={[
                styles.roleOption,
                user?.role === "ROLE_DISPATCHER" && styles.roleOptionActive,
              ]}
              onPress={() => handleSwitchRole("ROLE_DISPATCHER")}
            >
              <Text style={styles.roleOptionIcon}>📋</Text>
              <View>
                <Text style={styles.roleOptionTitle}>Dispatcher Console</Text>
                <Text style={styles.roleOptionDesc}>
                  Live ops, map dispatch, routes
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                user?.role === "ROLE_ADMIN" && styles.roleOptionActive,
              ]}
              onPress={() => handleSwitchRole("ROLE_ADMIN")}
            >
              <Text style={styles.roleOptionIcon}>🛡️</Text>
              <View>
                <Text style={styles.roleOptionTitle}>Admin Console</Text>
                <Text style={styles.roleOptionDesc}>
                  Full fleet, financial reports, settings
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                user?.role === "ROLE_DRIVER" && styles.roleOptionActive,
              ]}
              onPress={() => handleSwitchRole("ROLE_DRIVER")}
            >
              <Text style={styles.roleOptionIcon}>🚚</Text>
              <View>
                <Text style={styles.roleOptionTitle}>Driver View</Text>
                <Text style={styles.roleOptionDesc}>
                  Navigation, duties, attendance
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.logoutOption}
              onPress={handleLogout}
            >
              <Text style={styles.logoutOptionText}>🚪 Logout Session</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: authColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: authColors.headerBorder,
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 6,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  headerBrand: {
    fontSize: 16,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  brandAccent: {
    color: authColors.roleAccent,
  },
  orgBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  orgBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  headerSubtitle: {
    fontSize: 11,
    color: authColors.textMuted,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  roleBadge: {
    backgroundColor: authColors.roleActiveBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authColors.roleAccent,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: authColors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: authColors.textMuted,
    marginBottom: 4,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  roleOptionActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: authColors.roleActiveBg,
  },
  roleOptionIcon: {
    fontSize: 22,
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: authColors.cardBorder,
    marginVertical: 4,
  },
  logoutOption: {
    alignItems: "center",
    paddingVertical: 10,
  },
  logoutOptionText: {
    color: authColors.error,
    fontWeight: "700",
    fontSize: 14,
  },
});
