// Base API URL pointing to Node.js Express server
export const BASE_URL = "http://192.168.1.2:5000";

// Auth APIs
export const Login = `${BASE_URL}/api/auth/login`;
export const requestemail = `${BASE_URL}/api/auth/request-reset-password`;
export const resetPassword = `${BASE_URL}/api/auth/reset-password`;
export const Signup = `${BASE_URL}/api/user/create`;
export const GetMe = `${BASE_URL}/api/auth/me`;

// Vehicle APIs
export const RegisterVehicle = `${BASE_URL}/api/vehicle/create`;
export const GetVehicles = `${BASE_URL}/api/vehicle/`;
export const DeleteVehicle = `${BASE_URL}/api/vehicle/delete/`;
export const UpdateVehicle = `${BASE_URL}/api/vehicle/update/`;

// Trip APIs
export const RegisterTrip = `${BASE_URL}/api/trip/create`;
export const GetTrips = `${BASE_URL}/api/trip`;
export const DispatchTrip = `${BASE_URL}/api/trip/dispatch`;
export const CompleteTrip = `${BASE_URL}/api/trip/complete`;
export const CancelTrip = `${BASE_URL}/api/trip/cancel`;

// Driver & User APIs
export const GetDrivers = `${BASE_URL}/api/user`;

// Attendance & Geofencing APIs
export const CheckInUrl = `${BASE_URL}/api/attendance/check-in`;
export const CheckOutUrl = `${BASE_URL}/api/attendance/check-out`;
export const GetMyAttendanceUrl = `${BASE_URL}/api/attendance/my`;

// Issue Reporting ("Mess It Up") APIs
export const IssuesUrl = `${BASE_URL}/api/issues`;

// Maintenance & Expense APIs
export const MaintenanceUrl = `${BASE_URL}/api/maintenance`;
export const ExpensesUrl = `${BASE_URL}/api/expenses`;

// Dashboard & Analytics APIs
export const AdminDashboardUrl = `${BASE_URL}/api/dashboard/admin`;
export const DispatcherDashboardUrl = `${BASE_URL}/api/dashboard/dispatcher`;
export const DriverDashboardUrl = `${BASE_URL}/api/dashboard/driver`;
export const FleetAnalyticsUrl = `${BASE_URL}/api/analytics/fleet`;

// AI Assistant & Communication APIs
export const AIChatUrl = `${BASE_URL}/api/ai/chat`;
export const ChatConversationsUrl = `${BASE_URL}/api/chat/conversations`;
export const ChatDirectConversationUrl = `${BASE_URL}/api/chat/conversations/direct`;
export const ChatMessagesUrl = `${BASE_URL}/api/chat/messages`;

// Emergency SOS & POD APIs
export const EmergencySOSUrl = `${BASE_URL}/api/emergency/sos`;
export const PODUrl = `${BASE_URL}/api/pod`;
