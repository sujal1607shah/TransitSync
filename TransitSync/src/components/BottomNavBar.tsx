import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import useChatStore from "../store/ChatStore";

export interface TabItem {
  key: string;
  label: string;
  screen: string;
  icon: string;
  badge?: number | string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BottomNavBar() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const userRole = user?.role || "ROLE_DRIVER";

  const { conversations } = useChatStore();
  const totalUnread = Object.values(conversations).reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  const badgeValue = totalUnread > 0 ? totalUnread : undefined;

  // Define bottom bar tabs depending on user role
  let tabs: TabItem[] = [];

  if (userRole === "ROLE_DRIVER") {
    tabs = [
      { key: "home", label: "Home", screen: "Dashboard", icon: "🏠" },
      { key: "ai", label: "AI Chatbot", screen: "Chat", icon: "🤖" },
      { key: "chats", label: "Chats", screen: "TeamChat", icon: "💬", badge: badgeValue },
      { key: "report", label: "Mess It Up", screen: "Attendance", icon: "⚠️" },
    ];
  } else if (userRole === "ROLE_DISPATCHER") {
    tabs = [
      { key: "map", label: "Live Ops", screen: "Dashboard", icon: "🗺️" },
      { key: "dispatch", label: "Dispatch", screen: "Dispatch", icon: "📋" },
      { key: "vehicles", label: "Vehicles", screen: "Vehicles", icon: "🚚" },
      { key: "chats", label: "Chats", screen: "TeamChat", icon: "💬", badge: badgeValue },
      { key: "drivers", label: "Drivers", screen: "Drivers", icon: "👥" },
    ];
  } else {
    // Admin Role (5 core destinations for optimal touch target & typography)
    tabs = [
      { key: "dash", label: "Dashboard", screen: "Dashboard", icon: "📊" },
      { key: "fleet", label: "Fleet", screen: "Vehicles", icon: "🚚" },
      { key: "drivers", label: "Drivers", screen: "Drivers", icon: "👥" },
      { key: "trips", label: "Trips", screen: "Dispatch", icon: "📋" },
      { key: "chats", label: "Chats", screen: "TeamChat", icon: "💬", badge: badgeValue },
    ];
  }

  // Animated indicator setup
  const activeIndex = tabs.findIndex((t) => t.screen === route.name);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  
  const animatedValue = useRef(new Animated.Value(safeIndex)).current;
  const scaleValues = useRef(tabs.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: safeIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();

    // Pulse scale animation for active tab
    scaleValues.forEach((scale, idx) => {
      Animated.spring(scale, {
        toValue: idx === safeIndex ? 1.15 : 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    });
  }, [safeIndex, animatedValue, scaleValues]);

  const handleTabPress = (item: TabItem, index: number) => {
    if (route.name !== item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const tabWidth = (SCREEN_WIDTH - 16) / tabs.length;
  const indicatorTranslateX = animatedValue.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * tabWidth),
  });

  // Calculate safe bottom padding so it sits cleanly above phone gesture chin bar
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarInner}>
        {/* Animated Active Indicator Pill */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth - 8,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />

        {tabs.map((tab, idx) => {
          const isActive = idx === safeIndex;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, { width: tabWidth }]}
              onPress={() => handleTabPress(tab, idx)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: scaleValues[idx] || 1 }] },
                ]}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                {tab.badge ? (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </Animated.View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: authColors.cardBg,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
    paddingHorizontal: 8,
    paddingTop: 6,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  indicator: {
    position: "absolute",
    height: 52,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    borderRadius: 14,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.25)",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    zIndex: 2,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: 19,
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: authColors.textMuted,
    marginTop: 3,
    textAlign: "center",
  },
  tabLabelActive: {
    color: authColors.roleAccent,
    fontWeight: "800",
  },
});
