import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";

interface ScreenWrapperProps {
  children: React.ReactNode;
  title: string;
}

export default function ScreenWrapper({ children, title }: ScreenWrapperProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    navigation.replace("Login");
  };

  const navItems = [
    { label: "Dashboard", screen: "Dashboard", icon: "📊" },
    { label: "Driver Navigation", screen: "DriverNavigation", icon: "🗺️" },
    { label: "Vehicle Registry", screen: "Vehicles", icon: "🚚" },
    { label: "Drivers Profiles", screen: "Drivers", icon: "👥" },
    { label: "Trip Dispatcher", screen: "Dispatch", icon: "📋" },
    { label: "Trip Expenses", screen: "Expenses", icon: "💰" },
    { label: "Team Chat", screen: "TeamChat", icon: "💬" },
    { label: "AI Assistant", screen: "Chat", icon: "🤖" },
    { label: "Settings", screen: "Settings", icon: "⚙️" },
  ];

  const navigateTo = (screenName: string) => {
    setMenuVisible(false);
    if (route.name !== screenName) {
      navigation.navigate(screenName);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.statusDot}>🟢</Text>
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {/* Slide-out Sidebar Drawer Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.sidebarContainer}>
            <SafeAreaView style={styles.sidebarSafeArea} edges={["top", "bottom", "left"]}>
              <View style={styles.sidebarHeader}>
                <View style={styles.sidebarLogoRow}>
                  <Image
                    source={require("../assets/ChatGPT Image Aug 23, 2026, 08_28_18 PM.png")}
                    style={styles.sidebarLogoImage}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.logoText}>Transit<Text style={styles.logoAccent}>Sync</Text></Text>
                    <Text style={styles.logoSubtitle}>Dispatch Console</Text>
                  </View>
                </View>
              </View>

              {user && (
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() || "U"}</Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{user.name || "User"}</Text>
                    <Text style={styles.userRole}>
                      {user.role === "ROLE_DISPATCHER" ? "Dispatcher" : user.role === "ROLE_DRIVER" ? "Driver" : "Administrator"}
                    </Text>
                  </View>
                </View>
              )}

              <ScrollView style={styles.navScroll}>
                {navItems.map((item) => {
                  const isActive = route.name === item.screen;
                  return (
                    <TouchableOpacity
                      key={item.screen}
                      style={[styles.navItem, isActive && styles.navItemActive]}
                      onPress={() => navigateTo(item.screen)}
                    >
                      <Text style={styles.navIcon}>{item.icon}</Text>
                      <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.sidebarFooter}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutIcon}>🚪</Text>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
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
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    backgroundColor: authColors.inputBg,
  },
  menuButton: {
    padding: 4,
  },
  menuButtonText: {
    fontSize: 24,
    color: authColors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  headerRight: {
    width: 32,
    alignItems: "flex-end",
  },
  statusDot: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sidebarContainer: {
    width: "75%",
    height: "100%",
    backgroundColor: authColors.cardBg,
    borderRightWidth: 1,
    borderRightColor: authColors.cardBorder,
  },
  sidebarSafeArea: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
  },
  sidebarLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sidebarLogoImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  logoAccent: {
    color: authColors.roleAccent,
  },
  logoSubtitle: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: authColors.textPrimary,
  },
  userRole: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
  },
  navScroll: {
    flex: 1,
    paddingVertical: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
  },
  navIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  navItemText: {
    fontSize: 14,
    color: authColors.textSecondary,
    fontWeight: "500",
  },
  navItemTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    color: authColors.deleteText,
    fontWeight: "600",
  },
});
