import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../api/axiosClient";
import { GetDrivers } from "../api/apiPath";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "ROLE_ADMIN" | "ROLE_DISPATCHER" | "ROLE_DRIVER" | string;

export interface Contact {
  id: string;
  name: string;
  role: UserRole;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string; // "me" or contact id
  timestamp: number; // unix ms
  read: boolean;
  // Optional media attachment
  mediaUri?: string;
  mediaType?: "image" | "video" | "file";
  mediaName?: string; // for files
}

export interface Conversation {
  contactId: string;
  messages: ChatMessage[];
  unreadCount: number;
}

interface ChatState {
  contacts: Contact[];
  conversations: Record<string, Conversation>;
  loadingContacts: boolean;

  // Actions
  loadContacts: (currentUserId: string | number) => Promise<void>;
  getMessages: (contactId: string) => ChatMessage[];
  sendMessage: (contactId: string, text: string, senderName: string, mediaUri?: string, mediaType?: "image" | "video" | "file", mediaName?: string) => void;
  markRead: (contactId: string) => void;
  getLastMessage: (contactId: string) => ChatMessage | null;
  getUnread: (contactId: string) => number;
}

// ─── Bot reply pool per role ──────────────────────────────────────────────────
const DRIVER_REPLIES = [
  "Roger that, heading to the pickup point now. 🚚",
  "On my way, ETA about 15 minutes.",
  "Traffic is a bit heavy on Route 7, taking the bypass.",
  "Cargo loaded and secured. Ready to depart.",
  "Arrived at the destination. Unloading in progress.",
  "Vehicle check done — all good. Ready for next trip.",
  "Can you confirm the delivery address again?",
  "I'll need a break soon, been on the road for 4 hours.",
];

const ADMIN_REPLIES = [
  "Acknowledged. I'll review the report shortly.",
  "Good work, team. Keep up the efficiency!",
  "Route change approved. Proceed as planned.",
  "Please submit the expense receipt by end of day.",
  "Fleet audit is scheduled for Friday. Be prepared.",
  "Trip log has been updated in the system.",
  "All drivers, stand by for the morning briefing at 08:00.",
];

const DISPATCHER_REPLIES = [
  "Dispatch confirmed. Trip ID #4831 assigned.",
  "Vehicle TRK-04 is now available for your route.",
  "Route optimization done — saves 12 km on today's trips.",
  "New trip request received from depot. Assigning now.",
  "Fuel card approved for your next trip.",
  "Can you give me an update on the cargo status?",
  "Standby, I'm coordinating with the warehouse team.",
];

const MEDIA_REPLIES = [
  "Got it, photo received! 📸 I can see it clearly.",
  "Thanks for sharing the image. I'll review it.",
  "Photo noted. I'll look into this situation.",
  "Received the media. Will forward to the team.",
  "Image saved. We'll handle it ASAP. ✅",
];

function getReplyForRole(role: UserRole, hasMedia: boolean): string {
  if (hasMedia && Math.random() > 0.5) {
    return MEDIA_REPLIES[Math.floor(Math.random() * MEDIA_REPLIES.length)];
  }
  const pool =
    role === "ROLE_DRIVER"
      ? DRIVER_REPLIES
      : role === "ROLE_ADMIN"
      ? ADMIN_REPLIES
      : DISPATCHER_REPLIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Persistence helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = "transitSync_conversations";

async function saveConversations(convs: Record<string, Conversation>) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch {}
}

async function loadConversations(): Promise<Record<string, Conversation>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Mock team members (always present regardless of backend) ────────────────
const MOCK_CONTACTS: Contact[] = [
  { id: "admin-1", name: "Aisha Khan", role: "ROLE_ADMIN", isOnline: true },
  { id: "admin-2", name: "Rahul Mehta", role: "ROLE_ADMIN", isOnline: false },
  { id: "disp-1", name: "Sara Torres", role: "ROLE_DISPATCHER", isOnline: true },
  { id: "disp-2", name: "Omar Farooq", role: "ROLE_DISPATCHER", isOnline: true },
  { id: "driver-mock-1", name: "David Patel", role: "ROLE_DRIVER", isOnline: false },
  { id: "driver-mock-2", name: "Lena Raza", role: "ROLE_DRIVER", isOnline: true },
];

// ─── Store ────────────────────────────────────────────────────────────────────
const useChatStore = create<ChatState>((set, get) => ({
  contacts: [],
  conversations: {},
  loadingContacts: false,

  loadContacts: async (currentUserId) => {
    set({ loadingContacts: true });

    // Load persisted conversations first
    const savedConvs = await loadConversations();

    // Merge mock contacts
    let contacts: Contact[] = [...MOCK_CONTACTS];

    // Try fetching real drivers from the backend
    try {
      const res = await axios.get(GetDrivers, { params: { role: "ROLE_DRIVER" } });
      const data = res.data;
      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.serviceResult)) list = data.serviceResult;
      else if (Array.isArray(data?.data)) list = data.data;

      const liveDrivers: Contact[] = list
        .filter((d: any) => String(d.id) !== String(currentUserId))
        .map((d: any) => ({
          id: String(d.id),
          name: d.name ?? "Driver",
          role: d.role ?? "ROLE_DRIVER",
          isOnline: Math.random() > 0.4,
        }));

      // Deduplicate with mock
      const liveIds = new Set(liveDrivers.map((d) => d.id));
      const dedupedMock = MOCK_CONTACTS.filter((m) => !liveIds.has(m.id));
      contacts = [...liveDrivers, ...dedupedMock];
    } catch {
      // Fall back to mock contacts silently
    }

    // Ensure conversation entry for every contact
    const conversations = { ...savedConvs };
    for (const c of contacts) {
      if (!conversations[c.id]) {
        conversations[c.id] = { contactId: c.id, messages: [], unreadCount: 0 };
      }
    }

    set({ contacts, conversations, loadingContacts: false });
  },

  getMessages: (contactId) => {
    return get().conversations[contactId]?.messages ?? [];
  },

  sendMessage: (contactId, text, _senderName, mediaUri?, mediaType?, mediaName?) => {
    const now = Date.now();
    const userMsg: ChatMessage = {
      id: `msg-${now}`,
      text,
      senderId: "me",
      timestamp: now,
      read: true,
      ...(mediaUri ? { mediaUri, mediaType: mediaType ?? "image", mediaName } : {}),
    };

    set((state) => {
      const prev = state.conversations[contactId] ?? {
        contactId,
        messages: [],
        unreadCount: 0,
      };
      const updated = {
        ...state.conversations,
        [contactId]: {
          ...prev,
          messages: [...prev.messages, userMsg],
          unreadCount: 0,
        },
      };
      saveConversations(updated);
      return { conversations: updated };
    });

    // Simulate contact reply
    const contact = get().contacts.find((c) => c.id === contactId);
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const replyText = getReplyForRole(contact?.role ?? "ROLE_DRIVER", !!mediaUri);

      const replyMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: replyText,
        senderId: contactId,
        timestamp: Date.now(),
        read: false,
      };
      set((state) => {
        const prev = state.conversations[contactId] ?? {
          contactId,
          messages: [],
          unreadCount: 0,
        };
        const updated = {
          ...state.conversations,
          [contactId]: {
            ...prev,
            messages: [...prev.messages, replyMsg],
            unreadCount: prev.unreadCount + 1,
          },
        };
        saveConversations(updated);
        return { conversations: updated };
      });
    }, delay);
  },

  markRead: (contactId) => {
    set((state) => {
      const prev = state.conversations[contactId];
      if (!prev) return {};
      const updated = {
        ...state.conversations,
        [contactId]: {
          ...prev,
          messages: prev.messages.map((m) => ({ ...m, read: true })),
          unreadCount: 0,
        },
      };
      saveConversations(updated);
      return { conversations: updated };
    });
  },

  getLastMessage: (contactId) => {
    const msgs = get().conversations[contactId]?.messages ?? [];
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  },

  getUnread: (contactId) => {
    return get().conversations[contactId]?.unreadCount ?? 0;
  },
}));

export default useChatStore;
