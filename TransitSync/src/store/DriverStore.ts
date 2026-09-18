import { create } from "zustand";
import axios from "../api/axiosClient";
import { GetDrivers } from "../api/apiPath";

interface DriverState {
  loading: boolean;
  drivers: any[];
  driver: any | null;
  error: string | null;
  fetchDrivers: () => Promise<{ success: boolean; data?: any; message?: string }>;
  getDrivers: () => Promise<{ success: boolean; data?: any; message?: string }>;
  clearDriver: () => void;
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
}));

export default useDriverStore;
