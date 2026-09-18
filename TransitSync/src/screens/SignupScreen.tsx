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

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState(""); // MM/YYYY format
  const [selectedRole, setSelectedRole] = useState("ROLE_DRIVER");

  const { signup, loading, error } = useAuthStore();
  const navigation = useNavigation<any>();

  const roles = [
    { label: "Driver", value: "ROLE_DRIVER", icon: "🚚" },
    { label: "Dispatcher", value: "ROLE_DISPATCHER", icon: "📋" },
    { label: "Admin", value: "ROLE_ADMIN", icon: "🛡️" },
  ];

  const handleSignup = async () => {
    if (!name || !email || !password || !phoneNo) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (selectedRole === "ROLE_DRIVER" && (!licenseNo || !licenseExpiry)) {
      Alert.alert("Error", "Please enter license details for Driver registration");
      return;
    }

    let licenseExpiryDate = "";
    if (selectedRole === "ROLE_DRIVER") {
      const parts = licenseExpiry.split("/");
      if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 4) {
        Alert.alert("Error", "Invalid Expiry date. Please use MM/YYYY format.");
        return;
      }
      const mm = Number(parts[0]);
      const yyyy = Number(parts[1]);
      if (mm < 1 || mm > 12) {
        Alert.alert("Error", "Month must be between 01 and 12");
        return;
      }
      licenseExpiryDate = new Date(yyyy, mm - 1, 1).toISOString();
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phoneNo: phoneNo.trim(),
      licenseNo: selectedRole === "ROLE_DRIVER" ? licenseNo.trim() : undefined,
      licenseExpiryDate: selectedRole === "ROLE_DRIVER" ? licenseExpiryDate : undefined,
      role: selectedRole,
    };

    const result = await signup(payload);
    if (result.success) {
      Alert.alert("Success", "Account created successfully", [
        { text: "OK", onPress: () => navigation.replace("Dashboard") },
      ]);
    } else {
      Alert.alert("Registration Failed", result.message || "Could not complete signup");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <Loader show={loading} text="Creating account..." />
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
            <Text style={styles.subtitle}>Register New Account</Text>
          </View>

          <View style={styles.card}>
            {/* Full Name */}
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Alex Mercer"
              placeholderTextColor={authColors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Email Address */}
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="alex@fleet.com"
              placeholderTextColor={authColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Password */}
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={authColors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              placeholderTextColor={authColors.textMuted}
              keyboardType="phone-pad"
              value={phoneNo}
              onChangeText={setPhoneNo}
            />

            {/* Role selection dropdown */}
            <Text style={styles.label}>Select Role *</Text>
            <View style={styles.rolePickerContainer}>
              {roles.map((role) => {
                const isSelected = selectedRole === role.value;
                return (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleButton,
                      isSelected && styles.roleButtonActive,
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        isSelected && styles.roleButtonTextActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Conditionally show License Details if Driver is selected */}
            {selectedRole === "ROLE_DRIVER" && (
              <View style={styles.driverSection}>
                <Text style={styles.label}>Driver License Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DL-XXXXXXXXXXXX"
                  placeholderTextColor={authColors.textMuted}
                  autoCapitalize="characters"
                  value={licenseNo}
                  onChangeText={setLicenseNo}
                />

                <Text style={styles.label}>License Expiry (MM/YYYY) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12/2030"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={licenseExpiry}
                  onChangeText={setLicenseExpiry}
                />
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.submitButton} onPress={handleSignup}>
              <Text style={styles.submitButtonText}>Register Profile</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Sign In</Text>
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
    marginBottom: 28,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: 10,
    borderRadius: 14,
  },
  logoText: {
    fontSize: 32,
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
    elevation: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: authColors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: authColors.textPrimary,
    fontSize: 14,
    marginBottom: 14,
  },
  rolePickerContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    backgroundColor: authColors.inputBg,
  },
  roleButtonActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: authColors.roleActiveBg,
  },
  roleButtonText: {
    fontSize: 13,
    color: authColors.textSecondary,
    fontWeight: "500",
  },
  roleButtonTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  driverSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: authColors.cardBorder,
    paddingTop: 14,
  },
  errorText: {
    color: authColors.error,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 14,
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  loginText: {
    color: authColors.textSecondary,
    fontSize: 13,
  },
  loginLink: {
    color: authColors.roleAccent,
    fontWeight: "600",
    fontSize: 13,
  },
});
