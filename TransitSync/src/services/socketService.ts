import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../api/apiPath';

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;

  // Track event listeners to allow re-binding if socket reconnects
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.socket && this.currentToken === token && this.socket.connected) {
      return; // Already connected with this token
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.currentToken = token;
    
    this.socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected as', this.socket?.id);
      // Re-apply listeners safely without duplicating
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(cb => {
          this.socket?.off(event, cb as any);
          this.socket?.on(event, cb as any);
        });
      });
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.log('[Socket] Connection Error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const currentList = this.listeners.get(event)!;
    if (!currentList.includes(callback)) {
      currentList.push(callback);
    }
    
    if (this.socket) {
      this.socket.off(event, callback as any);
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!callback) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const remaining = callbacks.filter(cb => cb !== callback);
      if (remaining.length > 0) {
        this.listeners.set(event, remaining);
      } else {
        this.listeners.delete(event);
      }
    }
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  // Helper Methods
  joinConversation(conversationId: string) {
    this.emit('chat:join', { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.emit('chat:leave', { conversationId });
  }

  sendTypingStart(conversationId: string) {
    this.emit('typing:start', { conversationId });
  }

  sendTypingStop(conversationId: string) {
    this.emit('typing:stop', { conversationId });
  }
}

export const socketService = new SocketService();
