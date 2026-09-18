import React, { useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import useChatStore, { Contact } from "../store/ChatStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roleLabel(role: string): string {
  switch (role) {
    case "ROLE_ADMIN":
      return "Admin";
    case "ROLE_DISPATCHER":
      return "Dispatcher";
    case "ROLE_DRIVER":
      return "Driver";
    default:
      return role;
  }
}

function roleColor(role: string): string {
  switch (role) {
    case "ROLE_ADMIN":
      return authColors.error;
    case "ROLE_DISPATCHER":
      return authColors.roleAccent;
    case "ROLE_DRIVER":
      return authColors.teal400;
    default:
      return authColors.textMuted;
  }
}

function roleBg(role: string): string {
  switch (role) {
    case "ROLE_ADMIN":
      return authColors.errorBg;
    case "ROLE_DISPATCHER":
      return authColors.roleActiveBg;
    case "ROLE_DRIVER":
      return "rgba(45,212,191,0.12)";
    default:
      return "rgba(100,116,139,0.12)";
  }
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h`;
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Contact Row ──────────────────────────────────────────────────────────────
interface ContactRowProps {
  contact: Contact;
  lastMessage: string | null;
  lastTs: number | null;
  unread: number;
  onPress: () => void;
}

function ContactRow({ contact, lastMessage, lastTs, unread, onPress }: ContactRowProps) {
  const initials = contact.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const rColor = roleColor(contact.role);
  const rBg = roleBg(contact.role);

  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar */}
      <View style={[styles.avatarWrap, { borderColor: rColor }]}>
        <Text style={[styles.avatarText, { color: rColor }]}>{initials}</Text>
        {contact.isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Info */}
      <View style={styles.contactInfo}>
        <View style={styles.contactTop}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact.name}
          </Text>
          {lastTs && (
            <Text style={styles.lastTime}>{formatTimestamp(lastTs)}</Text>
          )}
        </View>
        <View style={styles.contactBottom}>
          <View style={[styles.roleBadge, { backgroundColor: rBg, borderColor: rColor }]}>
            <Text style={[styles.roleBadgeText, { color: rColor }]}>
              {roleLabel(contact.role)}
            </Text>
          </View>
          {lastMessage ? (
            <Text style={styles.lastMsg} numberOfLines={1}>
              {lastMessage}
            </Text>
          ) : (
            <Text style={styles.noMsg}>Tap to start chatting</Text>
          )}
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TeamChatScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { contacts, loadingContacts, loadContacts, getLastMessage, getUnread } =
    useChatStore();

  useEffect(() => {
    loadContacts(user?.id ?? "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = useCallback(
    (contact: Contact) => {
      navigation.navigate("ChatRoom", { contact });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Contact }) => {
      const last = getLastMessage(item.id);
      return (
        <ContactRow
          contact={item}
          lastMessage={last ? last.text : null}
          lastTs={last ? last.timestamp : null}
          unread={getUnread(item.id)}
          onPress={() => openChat(item)}
        />
      );
    },
    [getLastMessage, getUnread, openChat]
  );

  const keyExtractor = useCallback((item: Contact) => item.id, []);

  const totalUnread = contacts.reduce((sum, c) => sum + getUnread(c.id), 0);

  return (
    <ScreenWrapper title="Team Chat">
      {/* Header banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread} unread</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>
          {contacts.length} team member{contacts.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {loadingContacts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={authColors.roleAccent} />
          <Text style={styles.loadingText}>Loading contacts…</Text>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No contacts found</Text>
          <Text style={styles.emptySubtitle}>Pull down to refresh the team list</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  headerBanner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: authColors.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  totalUnreadBadge: {
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  totalUnreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  headerSub: {
    fontSize: 12,
    color: authColors.textMuted,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: authColors.textMuted,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: authColors.textMuted,
  },

  list: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: authColors.divider,
    marginLeft: 76,
  },

  // ── Contact Row ─────────────────────────────────────────────────────────────
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: authColors.cardBg,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: authColors.success,
    borderWidth: 2,
    borderColor: authColors.pageBg,
  },
  contactInfo: {
    flex: 1,
    gap: 5,
  },
  contactTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: authColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  lastTime: {
    fontSize: 11,
    color: authColors.textMuted,
  },
  contactBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  lastMsg: {
    fontSize: 12,
    color: authColors.textMuted,
    flex: 1,
  },
  noMsg: {
    fontSize: 12,
    color: authColors.textMuted,
    fontStyle: "italic",
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: authColors.roleAccent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: authColors.darkText,
  },
});
