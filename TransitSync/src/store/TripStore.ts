import { create } from "zustand";
import axios from "../api/axiosClient";
import { RegisterTrip, GetTrips, DispatchTrip, CompleteTrip, CancelTrip } from "../api/apiPath";

interface TripState {
  loading: boolean;
  trips: any[];
  trip: any | null;
  error: string | null;
  registerTrip: (payload: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  getTrips: () => Promise<{ success: boolean; data?: any; message?: string }>;
  dispatchTrip: (tripID: string | number) => Promise<{ success: boolean; data?: any; message?: string }>;
  completeTrip: (tripID: string | number, finalOdometer: number | string, fuelConsumed: number | string) => Promise<{ success: boolean; data?: any; message?: string }>;
  cancelTrip: (tripID: string | number, finalOdometer: number | string, fuelConsumed: number | string) => Promise<{ success: boolean; data?: any; message?: string }>;
  clearTrip: () => void;
}

const _extractList = (respData: any) => {
  if (Array.isArray(respData)) return respData;
  if (Array.isArray(respData?.serviceResult)) return respData.serviceResult;
  if (Array.isArray(respData?.data)) return respData.data;
  if (Array.isArray(respData?.trips)) return respData.trips;
  return [];
};

const _extractItem = (respData: any) => {
  if (!respData) return null;
  if (respData?.serviceResult && !Array.isArray(respData.serviceResult)) return respData.serviceResult;
  if (respData?.data && !Array.isArray(respData.data)) return respData.data;
  return respData;
};

const useTripStore = create<TripState>((set) => ({
  loading: false,
  trips: [],
  trip: null,
  error: null,

  registerTrip: async ({
    tripID,
    source,
    destination,
    vehicleID,
    driverID,
    cargoWeight,
    plannedDistance,
    startingOdometer,
    finalOdometer,
    fuelConsumed,
    status,
  }) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.post(RegisterTrip, {
        tripID,
        source,
        destination,
        vehicleID,
        driverID,
        cargoWeight,
        plannedDistance,
        startingOdometer,
        finalOdometer,
        fuelConsumed,
        status,
      });

      const data = _extractItem(response.data);

      set((state) => ({
        loading: false,
        trip: data,
        trips: [...state.trips, data].filter(Boolean),
        error: null,
      }));

      return { success: true, data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Trip creation failed";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  getTrips: async () => {
    try {
      set({ loading: true, error: null });

      const response = await axios.get(GetTrips);
      const list = _extractList(response.data);

      set({
        loading: false,
        trips: list,
        error: null,
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to fetch trips";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  dispatchTrip: async (tripID) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.put(`${DispatchTrip}/${tripID}`);
      const data = _extractItem(response.data);

      set((state) => ({
        loading: false,
        trips: state.trips.map((trip) =>
          trip.tripID === tripID ? data : trip
        ),
        error: null,
      }));

      return { success: true, data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to dispatch trip";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  completeTrip: async (tripID, finalOdometer, fuelConsumed) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.put(`${CompleteTrip}/${tripID}`, {
        finalOdometer,
        fuelConsumed,
      });
      const data = _extractItem(response.data);

      set((state) => ({
        loading: false,
        trips: state.trips.map((trip) =>
          trip.tripID === tripID ? data : trip
        ),
        error: null,
      }));

      return { success: true, data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to complete trip";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  cancelTrip: async (tripID, finalOdometer, fuelConsumed) => {
    try {
      set({ loading: true, error: null });

      const response = await axios.put(`${CancelTrip}/${tripID}`, {
        finalOdometer,
        fuelConsumed,
      });
      const data = _extractItem(response.data);

      set((state) => ({
        loading: false,
        trips: state.trips.map((trip) =>
          trip.tripID === tripID ? data : trip
        ),
        error: null,
      }));

      return { success: true, data };
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to cancel trip";
      set({ loading: false, error: errMsg });
      return { success: false, message: errMsg };
    }
  },

  clearTrip: () => {
    set({ trip: null, error: null });
  },
}));

export default useTripStore;
