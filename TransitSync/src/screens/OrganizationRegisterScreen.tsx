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

export default function OrganizationRegisterScreen() {
  const navigation = useNavigation<any>();
  const { registerOrganization, loading } = useAuthStore();

  // Organization Fields
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgCity, setOrgCity] = useState("Ahmedabad");
  const [orgCountry, setOrgCountry] = useState("India");
  const [orgTimezone, setOrgTimezone] = useState("Asia/Kolkata");
  const [orgCurrency, setOrgCurrency] = useState("INR (Rs)");

  // Admin Account Fields
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const handleRegister = async () => {
    if (!orgName || !orgCode) {
      Alert.alert("Error", "Please provide organization name and code");
      return;
    }
    if (!adminName || !adminEmail || !adminPassword) {
      Alert.alert("Error", "Please complete all administrator credentials");
      return;
    }

    const orgPayload = {
      name: orgName.trim(),
      code: orgCode.trim().toUpperCase(),
      email: orgEmail.trim() || adminEmail.trim(),
      phone: orgPhone.trim() || adminPhone.trim(),
      city: orgCity.trim(),
      country: orgCountry.trim(),
      timezone: orgTimezone,
      currency: orgCurrency,
    };

    const adminPayload = {
      name: adminName.trim(),
      email: adminEmail.trim().toLowerCase(),
      password: adminPassword,
      phone: adminPhone.trim(),
    };

    const res = await registerOrganization(orgPayload, adminPayload);
    if (res.success) {
      Alert.alert(
        "Organization Registered!",
        `Welcome to TransitSync! "${orgPayload.name}" and Admin account have been created successfully.`,
        [{ text: "Continue to Console", onPress: () => navigation.replace("Dashboard") }]
      );
    } else {
      Alert.alert("Registration Failed", res.message || "Could not register organization");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <Loader show={loading} text="Registering Organization..." />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <Image
              source={require("../assets/ChatGPT Image Aug 23, 2026, 08_28_18 PM.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Transit<Text style={styles.logoAccent}>Sync</Text></Text>
            <Text style={styles.subtitle}>New Tenant / Organization Onboarding</Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🏢</Text>
              <Text style={styles.sectionTitle}>1. Organization Profile</Text>
            </View>

            <Text style={styles.label}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC Logistics Pvt Ltd"
              placeholderTextColor={authColors.textMuted}
              value={orgName}
              onChangeText={(text) => {
                setOrgName(text);
                if (!orgCode && text.length >= 3) {
                  const autoCode = text.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() + "001";
                  setOrgCode(autoCode);
                }
              }}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Org Code (Unique) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. ABC001"
                  placeholderTextColor={authColors.textMuted}
                  autoCapitalize="characters"
                  value={orgCode}
                  onChangeText={(text) => setOrgCode(text.toUpperCase())}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={authColors.textMuted}
                  value={orgCity}
                  onChangeText={setOrgCity}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Currency</Text>
                <TextInput
                  style={styles.input}
                  value={orgCurrency}
                  onChangeText={setOrgCurrency}
                  placeholder="INR (Rs)"
                  placeholderTextColor={authColors.textMuted}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Timezone</Text>
                <TextInput
                  style={styles.input}
                  value={orgTimezone}
                  onChangeText={setOrgTimezone}
                  placeholder="Asia/Kolkata"
                  placeholderTextColor={authColors.textMuted}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Admin Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🛡️</Text>
              <Text style={styles.sectionTitle}>2. Primary Administrator Account</Text>
            </View>

            <Text style={styles.label}>Admin Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajesh Shah"
              placeholderTextColor={authColors.textMuted}
              value={adminName}
              onChangeText={setAdminName}
            />

            <Text style={styles.label}>Admin Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@abclogistics.com"
              placeholderTextColor={authColors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={adminEmail}
              onChangeText={setAdminEmail}
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Admin Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="phone-pad"
                  value={adminPhone}
                  onChangeText={setAdminPhone}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={authColors.textMuted}
                  secureTextEntry
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleRegister}>
              <Text style={styles.primaryButtonText}>Create Organization & Admin 🚀</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.cancelButtonText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    color: authColors.textPrimary,
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: authColors.roleAccent,
  },
  subtitle: {
    fontSize: 13,
    color: authColors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: authColors.cardBg,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: authColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: authColors.textMuted,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: authColors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: authColors.textPrimary,
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: authColors.border,
    marginVertical: 16,
  },
  primaryButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: authColors.roleAccent,
    fontSize: 13,
    fontWeight: "600",
  },
});
