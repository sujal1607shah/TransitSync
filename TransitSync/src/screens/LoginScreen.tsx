import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { authColors } from "../colors/colors";
import useAuthStore from "../store/AuthStore";
import Loader from "../components/Loader";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("ROLE_DISPATCHER"); // Default role
  const { login, loading, error } = useAuthStore();
  const navigation = useNavigation<any>();

  const roles = [
    { label: "Dispatcher", value: "ROLE_DISPATCHER", icon: "📋", color: authColors.roleAccent },
    { label: "Admin", value: "ROLE_ADMIN", icon: "🛡️", color: authColors.success },
    { label: "Driver", value: "ROLE_DRIVER", icon: "🚚", color: authColors.teal400 },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const result = await login(email.trim(), password, selectedRole);
    if (result.success) {
      navigation.replace("Dashboard");
    } else {
      Alert.alert("Authentication Failed", result.message || "Invalid credentials");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <Loader show={loading} text="Signing in..." />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Image
              source={require("../assets/ChatGPT Image Aug 23, 2026, 08_28_18 PM.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Transit<Text style={styles.logoAccent}>Sync</Text></Text>
            <Text style={styles.subtitle}>Fleet Dispatch Console</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Sign In</Text>

            {/* Role Selection */}
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.roleContainer}>
              {roles.map((role) => {
                const isSelected = selectedRole === role.value;
                return (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleButton,
                      isSelected && {
                        borderColor: role.color,
                        backgroundColor: `${role.color}15`,
                      },
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <Text
                      style={[
                        styles.roleText,
                        isSelected && { color: authColors.textPrimary, fontWeight: "700" },
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Email Input */}
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@transitsync.com"
              placeholderTextColor={authColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Password Input */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={authColors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
              <Text style={styles.submitButtonText}>Authorize Login</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.pageBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoImage: {
    width: 72,
    height: 72,
    marginBottom: 12,
    borderRadius: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: authColors.textPrimary,
  },
  logoAccent: {
    color: authColors.roleAccent,
  },
  subtitle: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: authColors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: authColors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    backgroundColor: authColors.inputBg,
  },
  roleIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    color: authColors.textSecondary,
    fontWeight: "500",
  },
  input: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: authColors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
    color: authColors.error,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#1a1200",
    fontSize: 15,
    fontWeight: "700",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    color: authColors.textSecondary,
    fontSize: 13,
  },
  signupLink: {
    color: authColors.roleAccent,
    fontWeight: "600",
    fontSize: 13,
  },
});
