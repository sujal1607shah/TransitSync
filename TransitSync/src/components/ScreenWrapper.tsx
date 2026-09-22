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
  const { user, logout } = useAuthStore();
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
            <Text style={styles.headerBrand}>
              Transit<Text style={styles.brandAccent}>Sync</Text>
            </Text>
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
          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>Switch View Mode</Text>
            <Text style={styles.roleSubtitle}>
              Experience UI custom tailored for each role
            </Text>

            <TouchableOpacity
              style={[
                styles.roleOption,
                user?.role === "ROLE_DRIVER" && styles.roleOptionActive,
              ]}
              onPress={() => handleSwitchRole("ROLE_DRIVER")}
            >
              <Text style={styles.roleOptionIcon}>🚗</Text>
              <View>
                <Text style={styles.roleOptionTitle}>Driver / Team View</Text>
                <Text style={styles.roleOptionDesc}>
                  3-Phase bottom tabs: AI Chatbot, Team Chat, Mess It Up
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                user?.role === "ROLE_DISPATCHER" && styles.roleOptionActive,
              ]}
              onPress={() => handleSwitchRole("ROLE_DISPATCHER")}
            >
              <Text style={styles.roleOptionIcon}>🗺️</Text>
              <View>
                <Text style={styles.roleOptionTitle}>Dispatcher View</Text>
                <Text style={styles.roleOptionDesc}>
                  Live Operations Map, Assign Driver sheet, Vehicle details
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
              <Text style={styles.roleOptionIcon}>📊</Text>
              <View>
                <Text style={styles.roleOptionTitle}>Admin Panel View</Text>
                <Text style={styles.roleOptionDesc}>
                  Dashboard metrics, Fleet management, Reports & Analytics
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutRow}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>🚪 Logout Session</Text>
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
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    backgroundColor: authColors.inputBg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  brandAccent: {
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
    gap: 10,
  },
  roleBadge: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  roleBadgeText: {
    color: authColors.roleAccent,
    fontSize: 12,
    fontWeight: "700",
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  content: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  roleCard: {
    width: "100%",
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  roleSubtitle: {
    fontSize: 12,
    color: authColors.textMuted,
    marginBottom: 16,
    marginTop: 2,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: authColors.inputBg,
    marginBottom: 10,
    gap: 12,
  },
  roleOptionActive: {
    borderWidth: 1.5,
    borderColor: authColors.roleAccent,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
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
    maxWidth: 220,
  },
  logoutRow: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  logoutText: {
    color: authColors.deleteText,
    fontWeight: "600",
    fontSize: 13,
  },
});
