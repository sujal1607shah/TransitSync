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
      
      return conv.conversationId;
    } catch (error) {
      console.error("Failed to get/create conversation", error);
      return null;
    }
  },

  fetchMessages: async (conversationId: string, contactId: string) => {
    try {
      const res = await axios.get(`${ChatConversationsUrl}/${conversationId}/messages`);
      const msgs = res.data?.data || res.data?.serviceResult || [];
      
      const parsedMsgs: ChatMessage[] = msgs.map((m: any) => ({
        id: m.messageId,
        text: m.content,
        senderId: String(m.senderId),
        timestamp: new Date(m.createdAt || m.timestamp || Date.now()).getTime(),
        read: m.read,
        mediaUri: m.mediaUri,
        mediaType: m.mediaType,
      }));

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

      // Optimistically we could add it, but since we have sockets, 
      // the socket handleNewMessage will actually push it to the state cleanly 
      // if we are the sender as well, or we can push optimistically.
      // We will push optimistically for better UX.

      const createdMsg = res.data?.data;
      if (!createdMsg) return;

      const userMsg: ChatMessage = {
        id: createdMsg.messageId,
        text: createdMsg.content,
        senderId: createdMsg.senderId,
        timestamp: new Date(createdMsg.createdAt || createdMsg.timestamp || Date.now()).getTime(),
        read: true,
        mediaUri: createdMsg.mediaUri,
        mediaType: createdMsg.mediaType as any,
      };

      set((s) => {
        const prev = s.conversations[contactId];
        if (!prev) return s;
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
    const isMe = String(msg.senderId) === currentUserId;
    if (isMe) return; // Handled optimistically in sendMessage

    const contactId = String(msg.senderId);

    const newMsg: ChatMessage = {
      id: msg.messageId,
      text: msg.content,
      senderId: contactId,
      timestamp: new Date(msg.createdAt || msg.timestamp || Date.now()).getTime(),
      read: false,
      mediaUri: msg.mediaUri,
      mediaType: msg.mediaType,
    };

    set((state) => {
      const prev = state.conversations[contactId];
      if (!prev) {
        // If we don't have the conversation loaded, we should ideally reload contacts
        // For now, we can just trigger a load
        setTimeout(() => get().loadConversations(currentUserId), 100);
        return state;
      }

      return {
        conversations: {
          ...state.conversations,
          [contactId]: {
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
