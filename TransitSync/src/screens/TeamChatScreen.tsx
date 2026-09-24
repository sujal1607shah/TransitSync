import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import useChatStore, { Contact } from "../store/ChatStore";
import axios from "../api/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatUsersUrl } from "../api/apiPath";

export default function TeamChatScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const currentUserId = user?.id || user?._id;
  const { contacts, loadingContacts, loadConversations, getLastMessage, getUnread, getOrCreateConversation } =
    useChatStore();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Team" | "Groups">("All");

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    if (currentUserId) {
      loadConversations(String(currentUserId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

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

      // Query organization-scoped users endpoint
      const res = await axios.get(ChatUsersUrl);
      const fetchedUsers = res.data?.data || res.data?.serviceResult || [];
      // Filter out the current user
      setAllUsers(fetchedUsers.filter((u: any) => String(u._id || u.id) !== String(currentUserId)));
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
    
    // Refresh conversations list
    if (currentUserId) {
      loadConversations(String(currentUserId));
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

  const renderContactItem = ({ item }: { item: Contact }) => {
    const lastMsg = getLastMessage(item.id);
    const unread = getUnread(item.id);

    return (
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("ChatRoom", { contact: item })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
          </View>
          {item.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            {lastMsg && (
              <Text style={styles.timeText}>
                {(() => {
                  const d = new Date(lastMsg.timestamp);
                  const h = d.getHours();
                  const m = d.getMinutes();
                  const ampm = h >= 12 ? "PM" : "AM";
                  const fh = h % 12 || 12;
                  const fm = m < 10 ? `0${m}` : m;
                  return `${fh}:${fm} ${ampm}`;
                })()}
              </Text>
            )}
          </View>

          <View style={styles.msgRow}>
            <Text style={[styles.lastMsgText, unread > 0 && styles.unreadMsgText]} numberOfLines={1}>
              {lastMsg ? lastMsg.text : "No messages yet"}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper title="Team Communications">
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={authColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          {(["All", "Team", "Groups"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contacts List */}
        {loadingContacts ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={authColors.roleAccent} />
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No Conversations Found</Text>
            <Text style={styles.emptySubtitle}>Start a new direct chat with a team member in your organization</Text>
            <TouchableOpacity style={styles.startChatBtn} onPress={handleOpenUsersModal}>
              <Text style={styles.startChatBtnText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContactItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Action Button (New Chat) */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleOpenUsersModal}>
          <Text style={styles.fabIcon}>✏️</Text>
        </TouchableOpacity>

        {/* Start Chat / User Selection Modal */}
        <Modal
          visible={showUsersModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUsersModal(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowUsersModal(false)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <Text style={styles.modalIconBadge}>👥</Text>
                  <Text style={styles.modalTitle}>Select Team Member</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowUsersModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Filter users..."
                  placeholderTextColor={authColors.textMuted}
                  value={userSearch}
                  onChangeText={setUserSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {userSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setUserSearch("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.modalClearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingUsers ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={authColors.roleAccent} />
                  <Text style={styles.modalLoadingText}>Loading team members...</Text>
                </View>
              ) : (
                <FlatList
                  data={allUsers.filter((u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()))}
                  keyExtractor={(u) => String(u._id || u.id)}
                  style={styles.modalUserList}
                  contentContainerStyle={styles.modalUserListContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  renderItem={({ item }) => {
                    const roleTag = item.role === "ROLE_ADMIN" || item.role === "ADMIN"
                      ? "Admin"
                      : item.role === "ROLE_DISPATCHER" || item.role === "DISPATCHER"
                      ? "Dispatcher"
                      : "Driver";
                    
                    const roleBadgeColor = roleTag === "Admin"
                      ? authColors.error
                      : roleTag === "Dispatcher"
                      ? authColors.roleAccent
                      : authColors.success;

                    const roleBadgeBg = roleTag === "Admin"
                      ? authColors.errorBg
                      : roleTag === "Dispatcher"
                      ? authColors.roleActiveBg
                      : authColors.successBg;

                    return (
                      <TouchableOpacity
                        style={styles.userItem}
                        activeOpacity={0.7}
                        onPress={() => handleStartChat(item)}
                      >
                        <View style={styles.userAvatar}>
                          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || "?"}</Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.userSub}>{item.phone || item.email || "Active Member"}</Text>
                        </View>
                        <View style={[styles.userRoleBadge, { backgroundColor: roleBadgeBg }]}>
                          <Text style={[styles.userRoleBadgeText, { color: roleBadgeColor }]}>
                            {roleTag}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyUsersContainer}>
                      <Text style={styles.emptyUsersIcon}>🔍</Text>
                      <Text style={styles.emptyUsersText}>No members found</Text>
                      <Text style={styles.emptyUsersSub}>Try searching for another name</Text>
                    </View>
                  }
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: authColors.border,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: authColors.textPrimary,
    fontSize: 14,
  },
  clearText: {
    color: authColors.textMuted,
    fontSize: 14,
    padding: 4,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tabButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: authColors.white,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  activeTabButton: {
    backgroundColor: authColors.roleAccent,
    borderColor: authColors.roleAccent,
  },
  tabText: {
    fontSize: 13,
    color: authColors.neutral600,
    fontWeight: "500",
  },
  activeTabText: {
    color: authColors.white,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 80,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.cardBg,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: authColors.border,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: authColors.roleActiveBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: authColors.roleAccent,
  },
  avatarText: {
    color: authColors.roleAccent,
    fontSize: 18,
    fontWeight: "700",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: authColors.success,
    borderWidth: 2,
    borderColor: authColors.cardBg,
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: authColors.textPrimary,
  },
  timeText: {
    fontSize: 11,
    color: authColors.textMuted,
  },
  msgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMsgText: {
    fontSize: 13,
    color: authColors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  unreadMsgText: {
    color: authColors.textPrimary,
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: authColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: authColors.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  startChatBtn: {
    backgroundColor: authColors.roleAccent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  startChatBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: authColors.roleAccent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: authColors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalIconBadge: {
    fontSize: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: authColors.darkText,
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: authColors.neutral500,
    fontWeight: "600",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.pageBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
  },
  modalSearchInput: {
    flex: 1,
    color: authColors.darkText,
    fontSize: 14,
    paddingVertical: 0,
    marginLeft: 6,
  },
  modalClearText: {
    fontSize: 14,
    color: authColors.neutral400,
    padding: 4,
  },
  modalLoading: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  modalLoadingText: {
    fontSize: 13,
    color: authColors.neutral500,
  },
  modalUserList: {
    maxHeight: 340,
  },
  modalUserListContent: {
    paddingBottom: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: authColors.divider,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authColors.roleActiveBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: authColors.darkText,
    marginBottom: 2,
  },
  userSub: {
    fontSize: 12,
    color: authColors.neutral500,
  },
  userRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userRoleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyUsersContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyUsersIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptyUsersText: {
    fontSize: 14,
    fontWeight: "600",
    color: authColors.darkText,
  },
  emptyUsersSub: {
    fontSize: 12,
    color: authColors.neutral500,
  },
});
