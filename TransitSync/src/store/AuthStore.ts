import { create } from "zustand";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Login, requestemail, resetPassword, Signup } from "../api/apiPath";

interface AuthState {
  loading: boolean;
  user: any | null;
  token: string | null;
  error: string | null;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  logout: () => Promise<void>;
  requestResetPassword: (email: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  resetUserPassword: (token: string, newPassword: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  signup: (payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  loading: true,
  user: null,
  token: null,
  error: null,
  initialized: false,

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");
      
      if (
        token === "demo-jwt-token" || 
        token === "demo-token" || 
        token === "bearer-token-live" || 
        token === "undefined" || 
        !token || 
        !token.startsWith("eyJ")
      ) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        set({ token: null, user: null, loading: false, initialized: true });
        return;
      }

      set({
        token,
        user: user ? JSON.parse(user) : null,
        loading: false,
        initialized: true,
      });
    } catch {
      set({
        loading: false,
        initialized: true,
      });
    }
  },

  login: async (email, password, role) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.post(Login, { email, password, role }, { timeout: 4000 });
      const data = response.data;

      if (data.success || response.status === 200) {
        const userObj = data.data || data.serviceResult || data.user || { email, role };
        const tokenStr = data.token || data.data?.token || data.serviceResult?.token;

        if (!tokenStr) {
          throw new Error("No token received from backend");
        }

        await AsyncStorage.setItem("token", tokenStr);
        await AsyncStorage.setItem("user", JSON.stringify(userObj));

        set({
          loading: false,
          user: userObj,
          token: tokenStr,
          error: null,
        });

        return { success: true, data: userObj };
      }
      throw new Error("Login failed");
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Login failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({
      user: null,
      token: null,
      error: null,
    });
  },

  requestResetPassword: async (email) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get(requestemail, {
        params: { email },
      });

      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Something went wrong";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  resetUserPassword: async (token, newPassword) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.post(resetPassword, null, {
        params: { token, newPassword },
      });

      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Password reset failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  signup: async (payload) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.post(Signup, payload, { timeout: 4000 });
      const data = response.data || {};

      const userObj = data.user || data.data || payload;
      const tokenStr = data.token || data.data?.token;

      if (!tokenStr) {
        throw new Error("No token received from backend during signup");
      }

      await AsyncStorage.setItem("token", tokenStr);
      await AsyncStorage.setItem("user", JSON.stringify(userObj));

      set({
        loading: false,
        user: userObj,
        token: tokenStr,
        error: null,
      });

      return { success: true, data: userObj };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Signup failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },
}));

export default useAuthStore;
