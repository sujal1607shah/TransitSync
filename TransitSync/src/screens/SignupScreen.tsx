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
  const selectedRole = "ROLE_ADMIN";

  const { signup, loading, error } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleSignup = async () => {
    if (!name || !email || !password || !phoneNo) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phoneNo: phoneNo.trim(),
      role: selectedRole,
    };

    const result = await signup(payload);
    if (result.success) {
      Alert.alert("Success", "Admin account created successfully", [
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

            {/* Role indicator badge */}
            <Text style={styles.label}>Account Role</Text>
            <View style={styles.adminRoleBadge}>
              <Text style={styles.adminRoleIcon}>🛡️</Text>
              <View>
                <Text style={styles.adminRoleTitle}>Organization Administrator</Text>
                <Text style={styles.adminRoleSub}>Full management of dispatchers, drivers, and fleet operations</Text>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.submitButton} onPress={handleSignup}>
              <Text style={styles.submitButtonText}>Create Administrator Account</Text>
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
  adminRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleAccent,
    marginBottom: 16,
  },
  adminRoleIcon: {
    fontSize: 24,
  },
  adminRoleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  adminRoleSub: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
    paddingRight: 16,
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
