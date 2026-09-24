import { create } from "zustand";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Login, requestemail, resetPassword, Signup, OrganizationRegisterUrl } from "../api/apiPath";

export interface OrganizationInfo {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  timezone?: string;
  currency?: string;
  geofence?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    name?: string;
  };
}

interface AuthState {
  loading: boolean;
  user: any | null;
  organization: OrganizationInfo | null;
  organizationId: string | null;
  token: string | null;
  error: string | null;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  registerOrganization: (organization: any, admin: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  logout: () => Promise<void>;
  requestResetPassword: (email: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  resetUserPassword: (token: string, newPassword: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  signup: (payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  createStaffUser: (payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  loading: true,
  user: null,
  organization: null,
  organizationId: null,
  token: null,
  error: null,
  initialized: false,

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      const orgStr = await AsyncStorage.getItem("organization");
      
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
        await AsyncStorage.removeItem("organization");
        set({ token: null, user: null, organization: null, organizationId: null, loading: false, initialized: true });
        return;
      }

      const parsedUser = userStr ? JSON.parse(userStr) : null;
      const parsedOrg = orgStr ? JSON.parse(orgStr) : null;

      set({
        token,
        user: parsedUser,
        organization: parsedOrg,
        organizationId: parsedUser?.organizationId || parsedOrg?.id || null,
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
        const orgObj = data.data?.organization || null;
        const orgId = data.data?.organizationId || userObj.organizationId || orgObj?.id || null;

        if (!tokenStr) {
          throw new Error("No token received from backend");
        }

        await AsyncStorage.setItem("token", tokenStr);
        await AsyncStorage.setItem("user", JSON.stringify(userObj));
        if (orgObj) {
          await AsyncStorage.setItem("organization", JSON.stringify(orgObj));
        }

        set({
          loading: false,
          user: userObj,
          organization: orgObj,
          organizationId: orgId,
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

  registerOrganization: async (organization, admin) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.post(OrganizationRegisterUrl, { organization, admin }, { timeout: 6000 });
      const data = response.data;

      if (data.success || response.status === 201) {
        const resultData = data.data;
        const userObj = resultData.user;
        const tokenStr = resultData.token;
        const orgObj = resultData.organization;

        if (!tokenStr) {
          throw new Error("No token received from backend during organization registration");
        }

        await AsyncStorage.setItem("token", tokenStr);
        await AsyncStorage.setItem("user", JSON.stringify(userObj));
        await AsyncStorage.setItem("organization", JSON.stringify(orgObj));

        set({
          loading: false,
          user: userObj,
          organization: orgObj,
          organizationId: orgObj?.id || userObj?.organizationId,
          token: tokenStr,
          error: null,
        });

        return { success: true, data: resultData };
      }
      throw new Error("Organization registration failed");
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Organization registration failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("organization");
    set({
      user: null,
      organization: null,
      organizationId: null,
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
      const orgId = data.data?.organizationId || userObj.organizationId || null;

      if (!tokenStr) {
        throw new Error("No token received from backend during signup");
      }

      await AsyncStorage.setItem("token", tokenStr);
      await AsyncStorage.setItem("user", JSON.stringify(userObj));

      set({
        loading: false,
        user: userObj,
        organizationId: orgId,
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

  createStaffUser: async (payload) => {
    try {
      set({ loading: true, error: null });
      // Call user creation API using authenticated client
      const axiosClient = (await import("../api/axiosClient")).default;
      const response = await axiosClient.post(Signup, payload);
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || "Failed to create staff user";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },
}));

export default useAuthStore;
