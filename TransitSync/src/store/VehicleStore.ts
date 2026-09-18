import { create } from "zustand";
import axios from "../api/axiosClient";
import { RegisterVehicle, GetVehicles, DeleteVehicle, UpdateVehicle } from "../api/apiPath";

interface VehicleState {
  loading: boolean;
  vehicles: any[];
  vehicle: any | null;
  error: string | null;
  registerVehicle: (payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  getVehicles: () => Promise<{ success: boolean; data?: any; message?: string }>;
  deleteVehicle: (id: string | number) => Promise<{ success: boolean; message?: string }>;
  updateVehicle: (id: string | number, payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  clearVehicle: () => void;
}

const useVehicleStore = create<VehicleState>((set) => ({
  loading: false,
  vehicles: [],
  vehicle: null,
  error: null,

  registerVehicle: async ({
    vehicleID,
    registrationNumber,
    name,
    type,
    maxLoadCapacity,
    odometer,
    acquisitionCost,
    status,
  }) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.post(RegisterVehicle, {
        vehicleID,
        registrationNumber,
        name,
        type,
        maxLoadCapacity,
        odometer,
        acquisitionCost,
        status,
      });

      set((state) => ({
        loading: false,
        vehicle: response.data,
        vehicles: [...state.vehicles, response.data],
      }));

      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Vehicle registration failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  getVehicles: async () => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get(GetVehicles);
      const data = response.data;

      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.serviceResult)) list = data.serviceResult;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.vehicles)) list = data.vehicles;

      set({ loading: false, vehicles: list });

      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to fetch vehicles";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  deleteVehicle: async (id) => {
    try {
      set({ loading: true, error: null });

      await axios.delete(DeleteVehicle, { params: { id } });

      set((state) => ({
        loading: false,
        vehicles: state.vehicles.filter((vehicle) => vehicle.vehicleID !== id),
      }));

      return { success: true };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to delete vehicle";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  updateVehicle: async (
    id,
    {
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      status,
    }
  ) => {
    try {
      set({ loading: true, error: null });

      const payload = {
        registrationNumber,
        name,
        type,
        maxLoadCapacity,
        odometer,
        acquisitionCost,
        status,
      };

      const response = await axios.put(UpdateVehicle, payload, { params: { id } });
      const data = response.data;

      set((state) => ({
        loading: false,
        vehicles: state.vehicles.map((vehicle) =>
          vehicle.vehicleID === id ? data : vehicle
        ),
        error: null,
      }));

      return { success: true, data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to update vehicle";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  clearVehicle: () => set({ vehicle: null, error: null }),
}));

export default useVehicleStore;
