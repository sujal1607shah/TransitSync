import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  senderName: string;
  timestamp: Date;
}

// ─── Bot replies ──────────────────────────────────────────────────────────────
const BOT_REPLIES: string[] = [
  "Got it, I'm checking the dispatch queue now. 🚚",
  "Fleet status updated — 2 vehicles are currently en route.",
  "Trip #4821 has been confirmed and assigned to Driver Patel.",
  "Heads up: Vehicle TRK-09 is due for a maintenance check.",
  "All systems are synced and operational. ✅",
  "The next scheduled dispatch is at 14:30 from Central Depot.",
  "Driver Raza has clocked in and is available for assignment.",
  "Route optimization for today's trips has been completed.",
  "Cargo manifest for Trip #4822 has been updated successfully.",
  "TransitSync AI is monitoring all active routes in real-time.",
  "No incidents reported on the Northern corridor.",
  "ETA for Trip #4819: approximately 22 minutes from destination.",
];

function getRandomReply(): string {
  return BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
interface AvatarProps {
  label: string;
  isBot: boolean;
}
function ChatAvatar({ label, isBot }: AvatarProps) {
  return (
    <View style={[styles.avatar, isBot ? styles.avatarBot : styles.avatarUser]}>
      <Text style={[styles.avatarText, isBot && styles.avatarTextBot]}>
        {isBot ? "AI" : label}
      </Text>
    </View>
  );
}

interface BubbleProps {
  message: ChatMessage;
}
function MessageBubble({ message }: BubbleProps) {
  const isUser = message.sender === "user";
  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowRight : styles.messageRowLeft,
      ]}
    >
      {!isUser && (
        <ChatAvatar label="AI" isBot />
      )}
      <View style={styles.bubbleColumn}>
        {!isUser && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextBot,
            ]}
          >
            {message.text}
          </Text>
        </View>
        <Text style={[styles.timestamp, isUser && styles.timestampRight]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
      {isUser && (
        <ChatAvatar label={message.senderName[0]?.toUpperCase() ?? "U"} isBot={false} />
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userName = user?.name ?? "Dispatcher";

  // Seed welcome message
  useEffect(() => {
    setMessages([
      {
        id: "welcome-1",
        text: "Welcome to TransitSync Chat! 🚦\nI'm your AI Dispatch Assistant. Ask me anything about fleet status, trip assignments, or driver availability.",
        sender: "bot",
        senderName: "Transit AI",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: "user",
      senderName: userName,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setBotTyping(true);
    scrollToBottom();

    // Simulate bot reply
    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: getRandomReply(),
        sender: "bot",
        senderName: "Transit AI",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setBotTyping(false);
      scrollToBottom();
    }, delay);
  }, [inputText, userName, scrollToBottom]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <ScreenWrapper title="Dispatch Chat">
      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.onlinePulse}>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.statusLabel}>Transit AI • Online</Text>
        <View style={styles.channelBadge}>
          <Text style={styles.channelBadgeText}>OPS CHANNEL</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            botTyping ? (
              <View style={styles.typingRow}>
                <ChatAvatar label="AI" isBot />
                <View style={styles.typingBubble}>
                  <ActivityIndicator
                    size="small"
                    color={authColors.logoRing}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.typingText}>Transit AI is typing…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message dispatch..."
            placeholderTextColor={authColors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="default"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },

  // ── Status bar ──────────────────────────────────────────────────────────────
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: authColors.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    gap: 8,
  },
  onlinePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: authColors.success,
  },
  statusLabel: {
    flex: 1,
    fontSize: 12,
    color: authColors.textSecondary,
    fontWeight: "500",
  },
  channelBadge: {
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  channelBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: authColors.roleAccent,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // ── Messages ────────────────────────────────────────────────────────────────
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 2,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  bubbleColumn: {
    maxWidth: "72%",
    gap: 3,
  },
  senderName: {
    fontSize: 10,
    color: authColors.logoRing,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: authColors.roleActiveBg,
    borderColor: authColors.roleActiveBorder,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: authColors.cardBg,
    borderColor: authColors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: authColors.textPrimary,
  },
  bubbleTextBot: {
    color: authColors.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    color: authColors.textMuted,
    marginLeft: 4,
  },
  timestampRight: {
    textAlign: "right",
    marginRight: 4,
    marginLeft: 0,
  },

  // ── Avatar ──────────────────────────────────────────────────────────────────
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18, // aligns with bubble bottom (above timestamp)
  },
  avatarBot: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: authColors.logoRing,
  },
  avatarUser: {
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  avatarTextBot: {
    color: authColors.logoRing,
    fontSize: 10,
  },

  // ── Typing indicator ────────────────────────────────────────────────────────
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
    color: authColors.textMuted,
    fontStyle: "italic",
  },

  // ── Input bar ───────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: authColors.inputBg,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    color: authColors.textPrimary,
    fontSize: 14,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: authColors.roleAccent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: authColors.neutral700,
    opacity: 0.5,
  },
  sendIcon: {
    color: authColors.darkText,
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 2,
  },
});
