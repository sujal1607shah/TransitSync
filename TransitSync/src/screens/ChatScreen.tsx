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
  ActivityIndicator,
  ScrollView,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  senderName: string;
  timestamp: Date;
}

const PRESET_CHIPS = [
  "Track my vehicle",
  "Today's trips",
  "Report an issue",
  "Contact dispatcher",
];

const BOT_REPLIES: Record<string, string> = {
  "Track my vehicle": "Your vehicle GJ01AB1234 is currently near SG Highway, Ahmedabad. It is assigned to Trip #TRP-1045. 📍",
  "Today's trips": "Today you have 1 active trip: TRP-1045 (Warehouse A 08:30 AM ➔ Client Location B 11:15 AM). 📦",
  "Report an issue": "You can report a vehicle issue, maintenance request, or route problem directly in the 'Mess It Up' tab! ⚠️",
  "Contact dispatcher": "Dispatcher Rohit Sharma is assigned to you. Live status: Available. 📞",
};

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

export default function ChatScreen() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userName = user?.name ?? "Alex Driver";

  useEffect(() => {
    setMessages([
      {
        id: "welcome-1",
        text: "Hi Alex!\nHow can I help you today?",
        sender: "bot",
        senderName: "AI Assistant",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSendText = useCallback(
    (textToSend?: string) => {
      const text = (textToSend || inputText).trim();
      if (!text) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        text,
        sender: "user",
        senderName: userName,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!textToSend) setInputText("");
      setBotTyping(true);
      scrollToBottom();

      const delay = 600 + Math.random() * 400;
      setTimeout(() => {
        const botReplyText =
          BOT_REPLIES[text] ||
          "I've updated your trip status in real-time. Let me know if you need anything else! 🚛";

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          text: botReplyText,
          sender: "bot",
          senderName: "AI Assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setBotTyping(false);
        scrollToBottom();
      }, delay);
    },
    [inputText, userName, scrollToBottom]
  );

  return (
    <ScreenWrapper title="AI Chatbot">
      {/* Bot Header info */}
      <View style={styles.statusBar}>
        <View style={styles.avatarBotHeader}>
          <Text style={styles.avatarBotText}>🤖</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.botTitle}>AI Assistant</Text>
          <Text style={styles.statusLabel}>🟢 Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isUser = item.sender === "user";
            return (
              <View
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowRight : styles.messageRowLeft,
                ]}
              >
                {!isUser && (
                  <View style={styles.avatarBot}>
                    <Text style={{ fontSize: 16 }}>🤖</Text>
                  </View>
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
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      isUser && styles.timestampRight,
                    ]}
                  >
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={
            botTyping ? (
              <View style={styles.typingRow}>
                <View style={styles.avatarBot}>
                  <Text style={{ fontSize: 14 }}>🤖</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={authColors.roleAccent} />
                  <Text style={styles.typingText}>AI Assistant is typing...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Action Preset Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        >
          {PRESET_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chipBtn}
              onPress={() => handleSendText(chip)}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>🎤</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={authColors.textMuted}
            onSubmitEditing={() => handleSendText()}
          />
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendText()}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: authColors.pageBg },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: authColors.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    gap: 12,
  },
  avatarBotHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBotText: { fontSize: 20 },
  statusInfo: { flex: 1 },
  botTitle: { fontSize: 15, fontWeight: "700", color: authColors.textPrimary },
  statusLabel: { fontSize: 11, color: "#10B981" },

  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: "row", gap: 10, marginVertical: 4 },
  messageRowLeft: { justifyContent: "flex-start" },
  messageRowRight: { justifyContent: "flex-end" },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  bubbleBot: {
    backgroundColor: authColors.cardBg,
    borderColor: authColors.cardBorder,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: authColors.roleAccent,
    borderColor: authColors.roleAccent,
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextBot: { color: authColors.textPrimary },
  bubbleTextUser: { color: "#FFFFFF", fontWeight: "500" },
  timestamp: { fontSize: 10, color: authColors.textMuted, marginTop: 4 },
  timestampRight: { color: "rgba(255,255,255,0.7)", textAlign: "right" },

  chipScroll: { maxHeight: 44, marginBottom: 8 },
  chipBtn: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipText: { color: authColors.roleAccent, fontSize: 12, fontWeight: "600" },

  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: authColors.cardBg,
    padding: 10,
    borderRadius: 12,
  },
  typingText: { color: authColors.textMuted, fontSize: 12 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: authColors.inputBg,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
    gap: 8,
  },
  iconBtn: { padding: 6 },
  textInput: {
    flex: 1,
    backgroundColor: authColors.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: authColors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: authColors.roleAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendIcon: { color: "#FFFFFF", fontWeight: "700" },
});
