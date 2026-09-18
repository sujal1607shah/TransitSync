import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import useAuthStore from "../store/AuthStore";
import Loader from "../components/Loader";

// Import Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
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
  const { token, initialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized) {
    return <Loader show={true} text="Initializing console..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={token ? "Dashboard" : "Login"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="Vehicles" component={VehicleRegistryScreen} />
        <Stack.Screen name="Drivers" component={DriverProfileScreen} />
        <Stack.Screen name="Dispatch" component={TripDispatchScreen} />
        <Stack.Screen name="Expenses" component={ExpenseScreen} />
        <Stack.Screen name="DriverNavigation" component={DriverNavigationScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="TeamChat" component={TeamChatScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
