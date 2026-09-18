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

const useAuthStore = create<AuthState>((set) => ({
  loading: true,
  user: null,
  token: null,
  error: null,
  initialized: false,

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");
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
    // Mock login for demo without backend
    if (email === 'test@transitsync.com' && password === 'password') {
      // Provide mock user based on role selection
      const roleMap: Record<string, any> = {
        ROLE_DISPATCHER: { id: 1, name: 'Demo Dispatcher', email, role: 'ROLE_DISPATCHER' },
        ROLE_ADMIN: { id: 2, name: 'Demo Admin', email, role: 'ROLE_ADMIN' },
        ROLE_DRIVER: { id: 3, name: 'Demo Driver', email, role: 'ROLE_DRIVER' },
      };
      const mockUser = roleMap[role] || { id: 0, name: 'Demo User', email, role };
      await AsyncStorage.setItem('token', 'mock-token');
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      set({ loading: false, user: mockUser, token: 'mock-token', error: null });
      return { success: true, data: mockUser };
    }
    try {
      set({ loading: true, error: null });

      const response = await axios.post(Login, { email, password, role });
      const data = response.data;

      if (!data.success) {
        set({ loading: false, error: data.message });
        return { success: false, message: data.message };
      }

      await AsyncStorage.setItem("token", data.serviceResult.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.serviceResult));

      set({
        loading: false,
        user: data.serviceResult,
        token: data.serviceResult.token,
        error: null,
      });

      return { success: true, data: data.serviceResult };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Login failed";
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

  signup: async ({
    name,
    email,
    password,
    phoneNo,
    licenseNo,
    licenseExpiryDate,
    role,
    driverStatus,
    safetyScore,
    driverID,
  }) => {
    // Mock signup for demo without backend
    if (email === 'test@transitsync.com' && password === 'password') {
      const mockUser = { id: 99, name, email, role };
      await AsyncStorage.setItem('token', 'mock-token');
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      set({ loading: false, user: mockUser, token: 'mock-token', error: null });
      return { success: true, data: { user: mockUser, token: 'mock-token' } };
    }
    try {
      set({ loading: true, error: null });

      const payload: any = {
        name,
        email,
        password,
        phoneNo,
        licenseNo,
        licenseExpiryDate,
        role,
      };

      if (driverStatus !== undefined) payload.driverStatus = driverStatus;
      if (safetyScore !== undefined) payload.safetyScore = safetyScore;
      if (driverID !== undefined) payload.driverID = driverID;

      const authToken = await AsyncStorage.getItem("token");

      const response = await axios.post(Signup, payload, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      const data = response.data || {};

      const extractToken = (resp: any) => {
        const d = resp?.data || {};
        if (d?.token) return d.token;
        if (d?.accessToken) return d.accessToken;
        if (d?.data?.token) return d.data.token;

        if (resp?.headers?.authorization) {
          const parts = resp.headers.authorization.split(" ");
          return parts.length === 2 ? parts[1] : resp.headers.authorization;
        }
        return null;
      };

      const newToken = extractToken(response) || data.token || data.accessToken || null;

      if (newToken) {
        await AsyncStorage.setItem("token", newToken);
      }

      set({
        loading: false,
        user: data.user || null,
        token: newToken || authToken,
        error: null,
      });

      return { success: true, data };
    } catch (error: any) {
      console.log("Signup Error:", error);
      const errMsg = error.response?.data?.message || error.message || "Signup failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },
}));

export default useAuthStore;
