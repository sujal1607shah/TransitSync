export const BASE_URL = "https://zr2c07nm-5000.inc1.devtunnels.ms";

export const Login = `${BASE_URL}/api/auth/login`;
export const requestemail = `${BASE_URL}/api/auth/request-reset-password`;
export const resetPassword = `${BASE_URL}/api/auth/reset-password`;
export const Signup = `${BASE_URL}/api/user/create`;

export const RegisterVehicle = `${BASE_URL}/api/vehicle/create`;
export const GetVehicles = `${BASE_URL}/api/vehicle/`;
export const DeleteVehicle = `${BASE_URL}/api/vehicle/delete/`;
export const UpdateVehicle = `${BASE_URL}/api/vehicle/update/`;

export const RegisterTrip = `${BASE_URL}/api/trip/create`;
export const GetTrips = `${BASE_URL}/api/trip`;
export const DispatchTrip = `${BASE_URL}/api/trip/dispatch`;
export const CompleteTrip = `${BASE_URL}/api/trip/complete`;
export const CancelTrip = `${BASE_URL}/api/trip/cancel`;

export const GetDrivers = `${BASE_URL}/api/user`;
