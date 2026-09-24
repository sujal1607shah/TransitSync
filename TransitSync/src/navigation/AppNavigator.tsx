import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import useAuthStore from "../store/AuthStore";
import useChatStore from "../store/ChatStore";
import Loader from "../components/Loader";

// Import Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import OrganizationRegisterScreen from "../screens/OrganizationRegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import VehicleRegistryScreen from "../screens/VehicleRegistryScreen";
import DriverProfileScreen from "../screens/DriverProfileScreen";
import TripDispatchScreen from "../screens/TripDispatchScreen";
import ExpenseScreen from "../screens/ExpenseScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ChatScreen from "../screens/ChatScreen";
import TeamChatScreen from "../screens/TeamChatScreen";
import ChatRoomScreen from "../screens/ChatRoomScreen";
import DriverNavigationScreen from "../screens/DriverNavigationScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, user, initialized, initializeAuth } = useAuthStore();
  const { initSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token && user?.id) {
      initSocket(token, user.id);
    } else {
      disconnectSocket();
    }
  }, [token, user?.id]);

  if (!initialized) {
    return <Loader show={true} text="Initializing console..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        {!token ? (
          // Logged Out Screens
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "fade" }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="RegisterOrg" component={OrganizationRegisterScreen} options={{ animation: "slide_from_right" }} />
          </Stack.Group>
        ) : (
          // Logged In Screens
          <Stack.Group>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Vehicles" component={VehicleRegistryScreen} />
            <Stack.Screen name="Drivers" component={DriverProfileScreen} />
            <Stack.Screen name="Dispatch" component={TripDispatchScreen} />
            <Stack.Screen name="Expenses" component={ExpenseScreen} />
            <Stack.Screen name="DriverNavigation" component={DriverNavigationScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="TeamChat" component={TeamChatScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ animation: "slide_from_right" }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
