import client from "../api/axiosClient";
import {
  Login as LoginUrl,
  Signup as SignupUrl,
  GetVehicles as GetVehiclesUrl,
  RegisterVehicle as RegisterVehicleUrl,
  GetTrips as GetTripsUrl,
  RegisterTrip as RegisterTripUrl,
  DispatchTrip as DispatchTripUrl,
  CompleteTrip as CompleteTripUrl,
  GetDrivers as GetDriversUrl,
} from "../api/apiPath";

export const authApi = {
  login: (credentials: { email: string; password?: string; role?: string }) =>
    client.post(LoginUrl, credentials),
  signup: (payload: any) => client.post(SignupUrl, payload),
  getMe: () => client.get("/api/auth/me"),
};

export const vehicleApi = {
  getVehicles: () => client.get(GetVehiclesUrl),
  registerVehicle: (payload: any) => client.post(RegisterVehicleUrl, payload),
  deleteVehicle: (id: string | number) => client.delete(`/api/vehicle/delete/?id=${id}`),
};

export const tripApi = {
  getTrips: () => client.get(GetTripsUrl),
  registerTrip: (payload: any) => client.post(RegisterTripUrl, payload),
  dispatchTrip: (id: string | number) => client.put(`${DispatchTripUrl}/${id}`),
  completeTrip: (id: string | number, payload: any) => client.put(`${CompleteTripUrl}/${id}`, payload),
};

export const driverApi = {
  getDrivers: () => client.get(GetDriversUrl, { params: { role: "ROLE_DRIVER" } }),
};

export const attendanceApi = {
  checkIn: (coords: { latitude: number; longitude: number }) => client.post("/api/attendance/check-in", coords),
  checkOut: (coords: { latitude: number; longitude: number }) => client.post("/api/attendance/check-out", coords),
  getMyAttendance: () => client.get("/api/attendance/my"),
};

export const issueApi = {
  createIssue: (payload: any) => client.post("/api/issues", payload),
  getIssues: () => client.get("/api/issues"),
  updateIssueStatus: (id: string, status: string) => client.patch(`/api/issues/${id}/status`, { status }),
};

export const aiApi = {
  chat: (prompt: string) => client.post("/api/ai/chat", { prompt }),
};

export const emergencyApi = {
  triggerSOS: (payload: any) => client.post("/api/emergency/sos", payload),
};

export const podApi = {
  submitPOD: (payload: any) => client.post("/api/pod", payload),
  getPODPDFUrl: (id: string) => `${client.defaults.baseURL}/api/pod/${id}/pdf`,
};
