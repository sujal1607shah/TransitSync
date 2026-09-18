import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Image,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
} from "react-native-image-picker";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import useChatStore, { Contact, ChatMessage } from "../store/ChatStore";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const IMAGE_BUBBLE_W = SCREEN_W * 0.6;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roleColor(role: string): string {
  switch (role) {
    case "ROLE_ADMIN": return authColors.error;
    case "ROLE_DISPATCHER": return authColors.roleAccent;
    case "ROLE_DRIVER": return authColors.teal400;
    default: return authColors.textMuted;
  }
}

function roleBg(role: string): string {
  switch (role) {
    case "ROLE_ADMIN": return authColors.errorBg;
    case "ROLE_DISPATCHER": return authColors.roleActiveBg;
    case "ROLE_DRIVER": return "rgba(45,212,191,0.12)";
    default: return "rgba(100,116,139,0.12)";
  }
}

function roleLabel(role: string): string {
  switch (role) {
    case "ROLE_ADMIN": return "Admin";
    case "ROLE_DISPATCHER": return "Dispatcher";
    case "ROLE_DRIVER": return "Driver";
    default: return role;
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Image lightbox ───────────────────────────────────────────────────────────
function ImageLightbox({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.lightboxOverlay} activeOpacity={1} onPress={onClose}>
        <Image source={{ uri }} style={styles.lightboxImage} resizeMode="contain" />
        <TouchableOpacity style={styles.lightboxClose} onPress={onClose}>
          <Text style={styles.lightboxCloseText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Media options modal ──────────────────────────────────────────────────────
interface MediaMenuProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

function MediaMenu({ visible, onClose, onCamera, onGallery }: MediaMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.mediaMenuCard}>
          <Text style={styles.mediaMenuTitle}>Send Media</Text>
          <TouchableOpacity style={styles.mediaMenuOption} onPress={onCamera}>
            <Text style={styles.mediaMenuIcon}>📷</Text>
            <View>
              <Text style={styles.mediaMenuLabel}>Take Photo</Text>
              <Text style={styles.mediaMenuSub}>Open camera</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.mediaMenuOption} onPress={onGallery}>
            <Text style={styles.mediaMenuIcon}>🖼️</Text>
            <View>
              <Text style={styles.mediaMenuLabel}>Photo & Video Library</Text>
              <Text style={styles.mediaMenuSub}>Choose from gallery</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaMenuCancel} onPress={onClose}>
            <Text style={styles.mediaMenuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
interface BubbleProps {
  message: ChatMessage;
  contact: Contact;
  isMe: boolean;
  onImagePress: (uri: string) => void;
}

function MessageBubble({ message, contact, isMe, onImagePress }: BubbleProps) {
  const rColor = roleColor(contact.role);
  const initials = contact.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const hasImage = message.mediaType === "image" && !!message.mediaUri;
  const hasVideo = message.mediaType === "video" && !!message.mediaUri;
  const hasText = !!message.text;

  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!isMe && (
        <View style={[styles.miniAvatar, { borderColor: rColor }]}>
          <Text style={[styles.miniAvatarText, { color: rColor }]}>{initials}</Text>
        </View>
      )}

      <View style={styles.bubbleCol}>
        {/* Image attachment */}
        {hasImage && (
          <TouchableOpacity
            onPress={() => onImagePress(message.mediaUri!)}
            activeOpacity={0.9}
            style={[styles.imageBubble, isMe ? styles.imageBubbleMe : styles.imageBubbleThem]}
          >
            <Image
              source={{ uri: message.mediaUri }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
            {hasText && (
              <View style={styles.imageCaption}>
                <Text style={styles.imageCaptionText}>{message.text}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Video placeholder */}
        {hasVideo && (
          <View style={[styles.videoBubble, isMe ? styles.imageBubbleMe : styles.imageBubbleThem]}>
            <Text style={styles.videoIcon}>▶️</Text>
            <Text style={styles.videoLabel}>Video</Text>
            {hasText && (
              <View style={styles.imageCaption}>
                <Text style={styles.imageCaptionText}>{message.text}</Text>
              </View>
            )}
          </View>
        )}

        {/* Text-only bubble */}
        {!hasImage && !hasVideo && hasText && (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={styles.bubbleText}>{message.text}</Text>
          </View>
        )}

        {/* Meta: time + ticks */}
        <View style={[styles.bubbleMeta, isMe && styles.bubbleMetaRight]}>
          <Text style={styles.bubbleTime}>{formatTime(message.timestamp)}</Text>
          {isMe && (
            <Text style={[styles.tickMark, message.read && styles.tickRead]}>✓✓</Text>
          )}
        </View>
      </View>

      {isMe && <View style={styles.meAvatarSpacer} />}
    </View>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ ts }: { ts: number }) {
  const label = new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <View style={styles.dateSep}>
      <Text style={styles.dateSepText}>{label}</Text>
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ contact }: { contact: Contact }) {
  const rColor = roleColor(contact.role);
  const initials = contact.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.miniAvatar, { borderColor: rColor }]}>
        <Text style={[styles.miniAvatarText, { color: rColor }]}>{initials}</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleThem, styles.typingBubble]}>
        <ActivityIndicator size="small" color={authColors.logoRing} />
        <Text style={styles.typingText}>{contact.name.split(" ")[0]} is typing…</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChatRoomScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const contact: Contact = route.params?.contact;

  const { user } = useAuthStore();
  const { getMessages, sendMessage, markRead, conversations } = useChatStore();

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mediaMenuVisible, setMediaMenuVisible] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<Asset | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const messages = getMessages(contact.id);

  useEffect(() => {
    markRead(contact.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id]);

  const conv = conversations[contact.id];
  useEffect(() => {
    if (!conv) return;
    const last = conv.messages[conv.messages.length - 1];
    if (last && last.senderId !== "me") {
      setIsTyping(false);
      markRead(contact.id);
    }
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.messages?.length]);

  // ─── Media picker ──────────────────────────────────────────────────────────
  const handlePickerResponse = useCallback((res: ImagePickerResponse) => {
    setMediaMenuVisible(false);
    if (res.didCancel || res.errorCode) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    setPendingMedia(asset);
  }, []);

  const openCamera = useCallback(() => {
    launchCamera(
      { mediaType: "mixed", quality: 0.8, saveToPhotos: false },
      handlePickerResponse
    );
  }, [handlePickerResponse]);

  const openGallery = useCallback(() => {
    launchImageLibrary(
      { mediaType: "mixed", quality: 0.8, selectionLimit: 1 },
      handlePickerResponse
    );
  }, [handlePickerResponse]);

  const removePendingMedia = useCallback(() => setPendingMedia(null), []);

  // ─── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text && !pendingMedia) return;

    const mediaUri = pendingMedia?.uri;
    const isVideo = pendingMedia?.type?.startsWith("video");
    const mediaType = isVideo ? "video" : pendingMedia ? "image" : undefined;

    sendMessage(
      contact.id,
      text,
      user?.name ?? "Me",
      mediaUri,
      mediaType,
      pendingMedia?.fileName
    );

    setInputText("");
    setPendingMedia(null);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3200);
  }, [inputText, pendingMedia, contact.id, user?.name, sendMessage]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isMe = item.senderId === "me";
      const prevTs = index > 0 ? messages[index - 1].timestamp : null;
      const showDate =
        !prevTs ||
        new Date(item.timestamp).toDateString() !== new Date(prevTs).toDateString();
      return (
        <>
          {showDate && <DateSeparator ts={item.timestamp} />}
          <MessageBubble
            message={item}
            contact={contact}
            isMe={isMe}
            onImagePress={(uri) => setLightboxUri(uri)}
          />
        </>
      );
    },
    [messages, contact]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);
  const rColor = roleColor(contact.role);

  const canSend = !!inputText.trim() || !!pendingMedia;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { borderColor: rColor }]}>
          <Text style={[styles.headerAvatarText, { color: rColor }]}>
            {contact.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
          </Text>
          {contact.isOnline && <View style={styles.headerOnlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contact.name}</Text>
          <View style={styles.headerSubRow}>
            <View style={[styles.rolePill, { backgroundColor: roleBg(contact.role), borderColor: rColor }]}>
              <Text style={[styles.rolePillText, { color: rColor }]}>{roleLabel(contact.role)}</Text>
            </View>
            <Text style={[styles.onlineStatus, contact.isOnline && styles.onlineStatusActive]}>
              {contact.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Messages + Input ─────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>💬</Text>
              <Text style={styles.emptyChatText}>No messages yet</Text>
              <Text style={styles.emptyChatSub}>Say hello to {contact.name.split(" ")[0]}!</Text>
            </View>
          }
          ListFooterComponent={isTyping ? <TypingIndicator contact={contact} /> : null}
        />

        {/* ── Pending media preview ───────────────────────────────────────── */}
        {pendingMedia && (
          <View style={styles.pendingMedia}>
            {pendingMedia.type?.startsWith("video") ? (
              <View style={styles.pendingVideoThumb}>
                <Text style={styles.pendingVideoIcon}>▶️</Text>
                <Text style={styles.pendingVideoName} numberOfLines={1}>
                  {pendingMedia.fileName ?? "video.mp4"}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: pendingMedia.uri }}
                style={styles.pendingImageThumb}
                resizeMode="cover"
              />
            )}
            <TouchableOpacity style={styles.removePending} onPress={removePendingMedia}>
              <Text style={styles.removePendingText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input bar ──────────────────────────────────────────────────── */}
        <View style={styles.inputBar}>
          {/* Attachment button */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setMediaMenuVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Message ${contact.name.split(" ")[0]}…`}
            placeholderTextColor={authColors.textMuted}
            multiline
            maxLength={500}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Media menu modal ─────────────────────────────────────────────── */}
      <MediaMenu
        visible={mediaMenuVisible}
        onClose={() => setMediaMenuVisible(false)}
        onCamera={openCamera}
        onGallery={openGallery}
      />

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightboxUri && (
        <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: authColors.pageBg },
  flex: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: authColors.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    gap: 10,
  },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 22, color: authColors.textPrimary, fontWeight: "600" },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: authColors.cardBg, borderWidth: 2,
    justifyContent: "center", alignItems: "center", position: "relative",
  },
  headerAvatarText: { fontSize: 15, fontWeight: "700" },
  headerOnlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: authColors.success,
    borderWidth: 2, borderColor: authColors.inputBg,
  },
  headerInfo: { flex: 1, gap: 3 },
  headerName: { fontSize: 15, fontWeight: "700", color: authColors.textPrimary },
  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rolePill: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  rolePillText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7 },
  onlineStatus: { fontSize: 11, color: authColors.textMuted },
  onlineStatusActive: { color: authColors.success },

  // ── Messages ─────────────────────────────────────────────────────────────────
  messageList: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 4 },
  messageListEmpty: { flex: 1, justifyContent: "center" },
  emptyChat: { alignItems: "center", gap: 6, paddingVertical: 48 },
  emptyChatIcon: { fontSize: 40 },
  emptyChatText: { fontSize: 15, fontWeight: "600", color: authColors.textSecondary },
  emptyChatSub: { fontSize: 13, color: authColors.textMuted },

  // ── Bubble ──────────────────────────────────────────────────────────────────
  bubbleRow: {
    flexDirection: "row", alignItems: "flex-end",
    marginVertical: 3, gap: 6,
  },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleCol: { maxWidth: "72%", gap: 2 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1 },
  bubbleMe: {
    backgroundColor: authColors.roleActiveBg,
    borderColor: authColors.roleActiveBorder,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: authColors.cardBg,
    borderColor: authColors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: authColors.textPrimary, lineHeight: 20 },
  bubbleMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 4 },
  bubbleMetaRight: { justifyContent: "flex-end" },
  bubbleTime: { fontSize: 10, color: authColors.textMuted },
  tickMark: { fontSize: 11, color: authColors.textMuted },
  tickRead: { color: authColors.logoRing },
  meAvatarSpacer: { width: 30 },
  miniAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: authColors.cardBg, borderWidth: 1.5,
    justifyContent: "center", alignItems: "center",
  },
  miniAvatarText: { fontSize: 11, fontWeight: "700" },

  // ── Image bubble ─────────────────────────────────────────────────────────────
  imageBubble: {
    borderRadius: 16, overflow: "hidden", borderWidth: 1,
    width: IMAGE_BUBBLE_W,
  },
  imageBubbleMe: { borderColor: authColors.roleActiveBorder },
  imageBubbleThem: { borderColor: authColors.cardBorder },
  bubbleImage: { width: "100%", height: IMAGE_BUBBLE_W * 0.75 },
  imageCaption: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  imageCaptionText: { color: "#fff", fontSize: 13 },

  // ── Video bubble ─────────────────────────────────────────────────────────────
  videoBubble: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
    width: IMAGE_BUBBLE_W, height: IMAGE_BUBBLE_W * 0.65,
    backgroundColor: authColors.cardBg,
    justifyContent: "center", alignItems: "center", gap: 6,
  },
  videoIcon: { fontSize: 36 },
  videoLabel: { fontSize: 13, color: authColors.textSecondary },

  // ── Typing ──────────────────────────────────────────────────────────────────
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 6 },
  typingText: { fontSize: 12, color: authColors.textMuted, fontStyle: "italic" },

  // ── Date separator ────────────────────────────────────────────────────────
  dateSep: { alignItems: "center", marginVertical: 10 },
  dateSepText: {
    fontSize: 11, color: authColors.textMuted, fontWeight: "600",
    letterSpacing: 0.6, textTransform: "uppercase",
    backgroundColor: authColors.cardBg, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: authColors.cardBorder,
  },

  // ── Pending media preview ─────────────────────────────────────────────────
  pendingMedia: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.cardBg,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  pendingImageThumb: {
    width: 60, height: 60, borderRadius: 10,
    borderWidth: 1, borderColor: authColors.cardBorder,
  },
  pendingVideoThumb: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: authColors.inputBg,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: authColors.cardBorder, flex: 1,
  },
  pendingVideoIcon: { fontSize: 24 },
  pendingVideoName: { fontSize: 13, color: authColors.textSecondary, flex: 1 },
  removePending: {
    marginLeft: "auto",
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: authColors.errorBg,
    borderWidth: 1, borderColor: authColors.error,
    justifyContent: "center", alignItems: "center",
  },
  removePendingText: { color: authColors.error, fontSize: 12, fontWeight: "700" },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: authColors.inputBg,
    borderTopWidth: 1, borderTopColor: authColors.cardBorder,
    gap: 8,
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: authColors.cardBg,
    borderWidth: 1, borderColor: authColors.cardBorder,
    justifyContent: "center", alignItems: "center",
  },
  attachIcon: { fontSize: 18 },
  textInput: {
    flex: 1,
    backgroundColor: authColors.cardBg,
    borderWidth: 1, borderColor: authColors.inputBorder,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    color: authColors.textPrimary,
    fontSize: 14, maxHeight: 120, lineHeight: 20,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: authColors.roleAccent,
    justifyContent: "center", alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: authColors.neutral700, opacity: 0.45 },
  sendIcon: { color: authColors.darkText, fontSize: 17, fontWeight: "700", marginLeft: 2 },

  // ── Media menu ────────────────────────────────────────────────────────────
  menuOverlay: { flex: 1, backgroundColor: authColors.modalOverlay, justifyContent: "flex-end" },
  mediaMenuCard: {
    backgroundColor: authColors.cardBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: authColors.cardBorder,
    padding: 24, paddingBottom: 36, gap: 4,
  },
  mediaMenuTitle: {
    fontSize: 13, fontWeight: "700", color: authColors.textMuted,
    textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8,
  },
  mediaMenuOption: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 16, gap: 16,
  },
  mediaMenuIcon: { fontSize: 28, width: 40, textAlign: "center" },
  mediaMenuLabel: { fontSize: 15, fontWeight: "600", color: authColors.textPrimary },
  mediaMenuSub: { fontSize: 12, color: authColors.textMuted, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: authColors.divider },
  mediaMenuCancel: {
    marginTop: 12,
    alignItems: "center", paddingVertical: 14,
    backgroundColor: authColors.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: authColors.cardBorder,
  },
  mediaMenuCancelText: { fontSize: 14, fontWeight: "600", color: authColors.deleteText },

  // ── Lightbox ──────────────────────────────────────────────────────────────
  lightboxOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center", alignItems: "center",
  },
  lightboxImage: { width: SCREEN_W, height: SCREEN_H * 0.8 },
  lightboxClose: {
    position: "absolute", top: 48, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  lightboxCloseText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
