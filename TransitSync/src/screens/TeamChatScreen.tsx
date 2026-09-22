import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import useChatStore, { Contact } from "../store/ChatStore";
import axios from "../api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GetDrivers } from "../api/apiPath";

export default function TeamChatScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { contacts, loadingContacts, loadConversations, getLastMessage, getUnread, getOrCreateConversation } =
    useChatStore();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Team" | "Groups">("All");

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadConversations(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "Team") return c.role === "ROLE_DISPATCHER" || c.role === "ROLE_ADMIN";
    if (activeTab === "Groups") return c.role === "ROLE_DRIVER";
    return true;
  });

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (token === "demo-jwt-token" || token === "demo-token") {
        const mockUsers = [
          { id: "1", name: "Aisha Khan (Admin)", role: "ROLE_ADMIN", isOnline: true },
          { id: "2", name: "Sara Torres (Dispatcher)", role: "ROLE_DISPATCHER", isOnline: true },
          { id: "3", name: "Alex Driver", role: "ROLE_DRIVER", isOnline: false },
          { id: "4", name: "John Doe", role: "ROLE_DRIVER", isOnline: true },
        ];
        setAllUsers(mockUsers.filter((u) => u.id !== user?.id));
        setLoadingUsers(false);
        return;
      }

      const res = await axios.get(GetDrivers);
      const fetchedUsers = res.data?.data || res.data?.serviceResult || [];
      // Filter out the current user
      setAllUsers(fetchedUsers.filter((u: any) => String(u._id || u.id) !== user?.id));
    } catch (err) {
      console.log("Error fetching users", err);
    }
    setLoadingUsers(false);
  };

  const handleOpenUsersModal = () => {
    setShowUsersModal(true);
    fetchAllUsers();
  };

  const handleStartChat = async (targetUser: any) => {
    setShowUsersModal(false);
    const contactId = String(targetUser._id || targetUser.id);
    
    // Attempt to pre-create or fetch the conversation
    await getOrCreateConversation(contactId);
    
    // We also want to refresh conversations so it appears in the list if it already existed
    if (user?.id) {
      loadConversations(user.id);
    }
    
    navigation.navigate("ChatRoom", {
      contact: {
        id: contactId,
        name: targetUser.name,
        role: targetUser.role,
        isOnline: targetUser.isOnline || false,
        avatar: targetUser.avatar,
      }
    });
  };

  return (
    <ScreenWrapper title="Chats with Team">
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={authColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {(["All", "Team", "Groups"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conversation List */}
        {loadingContacts ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={authColors.roleAccent} />
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No conversations found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const lastMsg = getLastMessage(item.id);
              const unread = getUnread(item.id);
              return (
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={() => navigation.navigate("ChatRoom", { contact: item })}
                >
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {item.name?.[0]?.toUpperCase() || "U"}
                    </Text>
                    {item.isOnline && <View style={styles.onlineBadge} />}
                  </View>

                  <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.nameText}>{item.name}</Text>
                      <Text style={styles.timeText}>
                        {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:30 AM"}
                      </Text>
                    </View>
                    <Text style={styles.msgText} numberOfLines={1}>
                      {lastMsg ? lastMsg.text : "Trip TRP-1045 assigned to you."}
                    </Text>
                  </View>

                  {unread > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>{unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={handleOpenUsersModal}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* Users List Modal */}
        {showUsersModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Chat</Text>
                <TouchableOpacity onPress={() => setShowUsersModal(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search user by name..."
                placeholderTextColor={authColors.textMuted}
                value={userSearch}
                onChangeText={setUserSearch}
              />

              {loadingUsers ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="small" color={authColors.roleAccent} />
                </View>
              ) : (
                <FlatList
                  data={allUsers.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()))}
                  keyExtractor={(item, index) => item._id || item.id || String(index)}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.contactCard} onPress={() => handleStartChat(item)}>
                      <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || "U"}</Text>
                      </View>
                      <View style={styles.infoCol}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={styles.timeText}>{item.role.replace("ROLE_", "")}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchContainer: { marginBottom: 12 },
  searchInput: {
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: authColors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: authColors.inputBg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  tabBtnActive: {
    backgroundColor: authColors.roleAccent,
    borderColor: authColors.roleAccent,
  },
  tabText: { color: authColors.textMuted, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#FFFFFF" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: authColors.textMuted, fontSize: 14 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: authColors.roleActiveBg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { color: authColors.roleAccent, fontWeight: "700", fontSize: 16 },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: authColors.cardBg,
  },
  infoCol: { flex: 1 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nameText: { fontSize: 14, fontWeight: "700", color: authColors.textPrimary },
  timeText: { fontSize: 11, color: authColors.textMuted },
  msgText: { fontSize: 12, color: authColors.textMuted, marginTop: 2 },
  unreadCountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadCountText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: authColors.roleAccent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: authColors.roleAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "400",
    lineHeight: 34,
  },
  modalOverlay: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: authColors.pageBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    padding: 16,
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
  modalCloseText: {
    fontSize: 14,
    color: authColors.roleAccent,
    fontWeight: "600",
  },
});
