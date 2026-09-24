import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { requestStoragePermission } from "./src/utils/permissions";

function App() {
  useEffect(() => {
    requestStoragePermission();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
