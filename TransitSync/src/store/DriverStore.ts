import { create } from "zustand";
import axios from "../api/axiosClient";
import { GetDrivers, Signup } from "../api/apiPath";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface DriverState {
  loading: boolean;
  drivers: any[];
  driver: any | null;
  error: string | null;
  fetchDrivers: () => Promise<{ success: boolean; data?: any; message?: string }>;
  getDrivers: () => Promise<{ success: boolean; data?: any; message?: string }>;
  clearDriver: () => void;
  createDriver: (payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
}

const useDriverStore = create<DriverState>((set, get) => ({
  loading: false,
  drivers: [],
  driver: null,
  error: null,

  fetchDrivers: async () => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get(GetDrivers, { params: { role: "ROLE_DRIVER" } });
      const data = response.data;

      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.serviceResult)) list = data.serviceResult;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.drivers)) list = data.drivers;

      set({ loading: false, drivers: list });

      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to fetch drivers";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  getDrivers: async () => {
    return get().fetchDrivers();
  },

  clearDriver: () => {
    set({ driver: null, error: null });
  },

  createDriver: async (payload: any) => {
    try {
      set({ loading: true, error: null });
      try {
        const response = await axios.post(Signup, payload);
        set({ loading: false });
        get().fetchDrivers(); // refresh list
        return { success: true, data: response.data };
      } catch (error: any) {
        throw error;
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to create driver";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },
}));

export default useDriverStore;
