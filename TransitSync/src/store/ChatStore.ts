import { create } from "zustand";
import axios from "../api/axiosClient";
import { GetDrivers, ChatConversationsUrl, ChatDirectConversationUrl, ChatMessagesUrl, BASE_URL } from "../api/apiPath";
import { socketService } from "../services/socketService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = "ROLE_ADMIN" | "ROLE_DISPATCHER" | "ROLE_DRIVER" | string;

export interface Contact {
  id: string;
  name: string;
  role: UserRole;
  isOnline: boolean;
  avatar?: string;
  conversationId?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  read: boolean;
  mediaUri?: string;
  mediaType?: "image" | "video" | "file";
  mediaName?: string;
}

export interface Conversation {
  contactId: string;
  conversationId: string;
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: number;
}

interface ChatState {
  contacts: Contact[]; // Derived from conversations
  conversations: Record<string, Conversation>;
  loadingContacts: boolean;

  // Actions
  initSocket: (token: string, userId: string) => void;
  disconnectSocket: () => void;
  loadConversations: (currentUserId: string) => Promise<void>;
  getOrCreateConversation: (userId: string) => Promise<string | null>;
  fetchMessages: (conversationId: string, contactId: string) => Promise<void>;
  getMessages: (contactId: string) => ChatMessage[];
  sendMessage: (contactId: string, text: string, senderName: string, mediaUri?: string, mediaType?: "image" | "video" | "file", mediaName?: string) => void;
  markRead: (contactId: string) => void;
  getLastMessage: (contactId: string) => ChatMessage | null;
  getUnread: (contactId: string) => number;
  
  // Real-time handlers exposed to the component
  handleNewMessage: (msg: any, currentUserId: string) => void;
}

const useChatStore = create<ChatState>((set, get) => ({
  contacts: [],
  conversations: {},
  loadingContacts: false,

  initSocket: (token: string, userId: string) => {
    socketService.connect(token);
    socketService.off('message:new');
    socketService.on('message:new', (msg) => {
      get().handleNewMessage(msg, userId);
    });
  },

  disconnectSocket: () => {
    socketService.disconnect();
    set({ contacts: [], conversations: {} });
  },

  loadConversations: async (currentUserId) => {
    set({ loadingContacts: true });

    try {      const res = await axios.get(ChatConversationsUrl);
      const data = res.data?.data || res.data?.serviceResult || [];
      
      const newConversations: Record<string, Conversation> = {};
      const newContacts: Contact[] = [];

      data.forEach((conv: any) => {
        // Find the other participant
        const otherParticipant = conv.participants.find((p: any) => String(p._id) !== currentUserId);
        if (!otherParticipant) return; // Skip if no other participant found (shouldn't happen for direct)

        const contactId = String(otherParticipant._id);
        
        newContacts.push({
          id: contactId,
          name: otherParticipant.name,
          role: otherParticipant.role,
          isOnline: otherParticipant.isOnline,
          avatar: otherParticipant.avatar,
          conversationId: conv.conversationId
        });

        const unread = conv.unreadCount ? (conv.unreadCount[currentUserId] || 0) : 0;

        newConversations[contactId] = {
          contactId,
          conversationId: conv.conversationId,
          messages: [],
          unreadCount: unread,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : Date.now()
        };
      });

      set({ contacts: newContacts, conversations: newConversations, loadingContacts: false });
    } catch (error) {
      console.error("Failed to load conversations", error);
      set({ loadingContacts: false });
    }
  },

  getOrCreateConversation: async (userId: string) => {
    try {
      const res = await axios.post(ChatDirectConversationUrl, { userId });
      const conv = res.data?.data;
      if (!conv) return null;

      const conversationId = conv.conversationId;
      const contactId = String(userId);

      set((state) => {
        const existing = state.conversations[contactId];
        return {
          conversations: {
            ...state.conversations,
            [contactId]: {
              contactId,
              conversationId,
              messages: existing ? existing.messages : [],
              unreadCount: existing ? existing.unreadCount : 0,
              lastMessage: conv.lastMessage || existing?.lastMessage,
              lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : Date.now(),
            },
          },
        };
      });

      return conversationId;
    } catch (error) {
      console.error("Failed to get/create conversation", error);
      return null;
    }
  },

  fetchMessages: async (conversationId: string, contactId: string) => {
    try {
      const res = await axios.get(`${ChatConversationsUrl}/${conversationId}/messages`);
      const msgs = res.data?.data || res.data?.serviceResult || [];
      
      const seenIds = new Set<string>();
      const parsedMsgs: ChatMessage[] = [];
      for (const m of msgs) {
        const id = m.messageId || m._id || m.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          parsedMsgs.push({
            id,
            text: m.content || m.text || '',
            senderId: String(m.senderId),
            timestamp: new Date(m.createdAt || m.timestamp || Date.now()).getTime(),
            read: m.read,
            mediaUri: m.mediaUri,
            mediaType: m.mediaType,
          });
        }
      }

      set((state) => {
        const prev = state.conversations[contactId];
        if (!prev) return state;

        return {
          conversations: {
            ...state.conversations,
            [contactId]: {
              ...prev,
              messages: parsedMsgs
            }
          }
        };
      });

    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  },

  getMessages: (contactId) => {
    return get().conversations[contactId]?.messages ?? [];
  },

  sendMessage: async (contactId, text, senderName, mediaUri?, mediaType?, mediaName?) => {
    const state = get();
    let conversationId = state.conversations[contactId]?.conversationId;

    if (!conversationId) {
      conversationId = await state.getOrCreateConversation(contactId) || '';
      if (!conversationId) return; // Error creating
    }

    try {
      const res = await axios.post(ChatMessagesUrl, {
        conversationId,
        content: text,
        mediaUri,
        mediaType
      });

      // Optimistically add to local state
      const createdMsg = res.data?.data;
      if (!createdMsg) return;

      const userMsg: ChatMessage = {
        id: createdMsg.messageId || createdMsg.id || `msg_${Date.now()}`,
        text: createdMsg.content || text,
        senderId: createdMsg.senderId,
        timestamp: new Date(createdMsg.createdAt || createdMsg.timestamp || Date.now()).getTime(),
        read: true,
        mediaUri: createdMsg.mediaUri,
        mediaType: createdMsg.mediaType as any,
      };

      set((s) => {
        const prev = s.conversations[contactId];
        if (!prev) return s;

        // Deduplication check: do not add if message with this ID already exists
        if (prev.messages.some((m) => m.id === userMsg.id)) {
          return s;
        }

        return {
          conversations: {
            ...s.conversations,
            [contactId]: {
              ...prev,
              messages: [...prev.messages, userMsg],
              lastMessage: text,
              lastMessageAt: userMsg.timestamp
            }
          }
        };
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  },

  handleNewMessage: (msg: any, currentUserId: string) => {
    if (!msg) return;

    // Sender shouldn't process their own message via socket (handled optimistically)
    const isMe = String(msg.senderId) === String(currentUserId);
    if (isMe) return;

    const messageId = msg.messageId || msg.id || msg._id;
    const contactId = String(msg.senderId);

    const newMsg: ChatMessage = {
      id: messageId,
      text: msg.content || msg.text || '',
      senderId: contactId,
      timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()).getTime(),
      read: false,
      mediaUri: msg.mediaUri,
      mediaType: msg.mediaType,
    };

    set((state) => {
      // Find matching conversation: first by contactId, fallback by conversationId
      let targetContactId = contactId;
      let prev = state.conversations[targetContactId];

      if (!prev && msg.conversationId) {
        const found = Object.values(state.conversations).find(
          (c) => c.conversationId === msg.conversationId
        );
        if (found) {
          targetContactId = found.contactId;
          prev = found;
        }
      }

      if (!prev) {
        // If we don't have the conversation loaded yet, reload conversations
        setTimeout(() => get().loadConversations(currentUserId), 100);
        return state;
      }

      // CRITICAL DEDUPLICATION:
      // Prevent duplicate messages if messageId matches OR if sender + content + timestamp are identical
      const alreadyExists = prev.messages.some(
        (m) =>
          (m.id && newMsg.id && m.id === newMsg.id) ||
          (m.senderId === newMsg.senderId &&
            m.text === newMsg.text &&
            Math.abs(m.timestamp - newMsg.timestamp) < 2000)
      );

      if (alreadyExists) {
        return state;
      }

      return {
        conversations: {
          ...state.conversations,
          [targetContactId]: {
            ...prev,
            messages: [...prev.messages, newMsg],
            unreadCount: prev.unreadCount + 1,
            lastMessage: newMsg.text,
            lastMessageAt: newMsg.timestamp
          }
        }
      };
    });
  },

  markRead: async (contactId) => {
    const state = get();
    const conv = state.conversations[contactId];
    if (!conv || !conv.conversationId) return;

    try {
      await axios.patch(`${BASE_URL}/api/chat/conversations/${conv.conversationId}/read`);
      
      set((s) => {
        const prev = s.conversations[contactId];
        if (!prev) return s;
        return {
          conversations: {
            ...s.conversations,
            [contactId]: {
              ...prev,
              messages: prev.messages.map((m) => ({ ...m, read: true })),
              unreadCount: 0,
            },
          },
        };
      });
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  },

  getLastMessage: (contactId) => {
    const msgs = get().conversations[contactId]?.messages ?? [];
    if (msgs.length > 0) return msgs[msgs.length - 1];
    
    // Fallback to conversation summary
    const conv = get().conversations[contactId];
    if (conv && conv.lastMessage) {
      return {
        id: 'mock',
        text: conv.lastMessage,
        senderId: contactId,
        timestamp: conv.lastMessageAt || 0,
        read: true
      };
    }
    return null;
  },

  getUnread: (contactId) => {
    return get().conversations[contactId]?.unreadCount ?? 0;
  },
}));

export default useChatStore;
