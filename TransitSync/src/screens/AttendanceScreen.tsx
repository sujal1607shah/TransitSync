import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";
import { isInsideGeofence, OFFICE_LOCATION, USER_LOCATION } from "../utils/geofence";

export default function AttendanceScreen() {
  // Step flow: 'CATEGORY' | 'FORM' | 'CONFIRMATION'
  const [step, setStep] = useState<"CATEGORY" | "FORM" | "CONFIRMATION">("CATEGORY");

  // Form states
  const [selectedType, setSelectedType] = useState("Engine Problem");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"High" | "Medium" | "Low">("High");
  const [submittedReportId, setSubmittedReportId] = useState("#ISS-1033");

  const present = isInsideGeofence(USER_LOCATION, OFFICE_LOCATION);

  const handleSubmit = () => {
    const newId = `#ISS-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedReportId(newId);
    setStep("CONFIRMATION");
  };

  return (
    <ScreenWrapper title="Mess It Up (Report Issue)">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* STEP 1: CATEGORY SELECTION & RECENT REPORTS */}
        {step === "CATEGORY" && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>⚠️ Report an Issue</Text>
            <Text style={styles.stepDesc}>Report any breakdown, route problem or incident immediately.</Text>

            {/* Categories */}
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedType("Engine Problem");
                  setStep("FORM");
                }}
              >
                <Text style={styles.categoryIcon}>🚙</Text>
                <Text style={styles.categoryLabel}>Vehicle Issue</Text>
                <Text style={styles.categorySub}>Engine, tyre, fuel problem</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedType("Scheduled Service");
                  setStep("FORM");
                }}
              >
                <Text style={styles.categoryIcon}>🛠️</Text>
                <Text style={styles.categoryLabel}>Maintenance</Text>
                <Text style={styles.categorySub}>Service & repair request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedType("Route Traffic Delay");
                  setStep("FORM");
                }}
              >
                <Text style={styles.categoryIcon}>📍</Text>
                <Text style={styles.categoryLabel}>Trip / Route Problem</Text>
                <Text style={styles.categorySub}>Traffic, road blockages</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedType("Accident Report");
                  setStep("FORM");
                }}
              >
                <Text style={styles.categoryIcon}>🚨</Text>
                <Text style={styles.categoryLabel}>Incident Report</Text>
                <Text style={styles.categorySub}>Accident or emergency</Text>
              </TouchableOpacity>
            </View>

            {/* Attendance Quick Check */}
            <View style={styles.attendanceBox}>
              <Text style={styles.attendanceTitle}>📍 Duty Geofence Status</Text>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Current Location Check:</Text>
                <Text style={[styles.attendanceBadge, { color: present ? "#10B981" : "#EF4444" }]}>
                  {present ? "In Office Geofence (Present)" : "On Field Route"}
                </Text>
              </View>
            </View>

            {/* Recent Reports */}
            <View style={styles.recentHeader}>
              <Text style={styles.sectionHeading}>Recent Reports</Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentReportCard}>
              <View style={styles.recentReportRow}>
                <Text style={styles.recentReportId}>#ISS-1032</Text>
                <View style={styles.badgeProgress}>
                  <Text style={styles.badgeProgressText}>In Progress</Text>
                </View>
              </View>
              <Text style={styles.recentReportTitle}>Brake Issue</Text>
              <Text style={styles.recentReportDate}>10 Sep 2026</Text>
            </View>

            <View style={styles.recentReportCard}>
              <View style={styles.recentReportRow}>
                <Text style={styles.recentReportId}>#ISS-1028</Text>
                <View style={styles.badgeResolved}>
                  <Text style={styles.badgeResolvedText}>Resolved</Text>
                </View>
              </View>
              <Text style={styles.recentReportTitle}>Tyre Puncture</Text>
              <Text style={styles.recentReportDate}>08 Sep 2026</Text>
            </View>
          </View>
        )}

        {/* STEP 2: ISSUE FORM */}
        {step === "FORM" && (
          <View style={styles.stepSection}>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep("CATEGORY")}>
              <Text style={styles.backLinkText}>← Back to categories</Text>
            </TouchableOpacity>

            <Text style={styles.stepTitle}>Issue Details</Text>
            <Text style={styles.stepDesc}>Provide details so maintenance & dispatch can help fast.</Text>

            {/* Issue Type Select */}
            <Text style={styles.inputLabel}>Select Issue Type</Text>
            <View style={styles.typeSelector}>
              {["Engine Problem", "Tyre Puncture", "Brake Fault", "Route Delay"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, selectedType === type && styles.typeOptionActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.typeOptionText, selectedType === type && styles.typeOptionTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              placeholder="Engine making unusual noise since morning..."
              placeholderTextColor={authColors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            {/* Upload Photos */}
            <Text style={styles.inputLabel}>Upload Photos</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoAddBox}>
                <Text style={styles.photoPlus}>+</Text>
                <Text style={styles.photoAddText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Severity */}
            <Text style={styles.inputLabel}>Severity Level</Text>
            <View style={styles.severityRow}>
              {(["High", "Medium", "Low"] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.severityBtn, severity === level && styles.severityBtnActive]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[styles.severityText, severity === level && styles.severityTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
              <Text style={styles.primaryBtnText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: SUBMISSION CONFIRMATION */}
        {step === "CONFIRMATION" && (
          <View style={styles.confirmationSection}>
            <View style={styles.successCheckCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>

            <Text style={styles.confirmTitle}>Report Submitted!</Text>
            <Text style={styles.confirmSub}>Your issue has been reported successfully.</Text>

            <View style={styles.confirmSummaryCard}>
              <View style={styles.confirmSummaryRow}>
                <View>
                  <Text style={styles.confirmLabel}>Report ID</Text>
                  <Text style={styles.confirmVal}>{submittedReportId}</Text>
                </View>
                <View>
                  <Text style={styles.confirmLabel}>Status</Text>
                  <View style={styles.badgeProgress}>
                    <Text style={styles.badgeProgressText}>In Progress</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.timelineTitle}>Status Timeline</Text>
              
              <View style={styles.timelineItem}>
                <Text style={styles.timelineIcon}>🟢</Text>
                <View>
                  <Text style={styles.timelineName}>Report Submitted</Text>
                  <Text style={styles.timelineTime}>14 Sep 2026, 10:45 AM</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <Text style={styles.timelineIcon}>🛠️</Text>
                <View>
                  <Text style={styles.timelineName}>Assigned to Maintenance Team</Text>
                  <Text style={styles.timelineTime}>14 Sep 2026, 11:10 AM</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <Text style={styles.timelineIcon}>⌛</Text>
                <View>
                  <Text style={styles.timelineName}>In Progress</Text>
                  <Text style={styles.timelineTime}>14 Sep 2026, 12:30 PM</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setStep("CATEGORY")}
            >
              <Text style={styles.primaryBtnText}>View All Reports / Submit New</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  stepSection: {
    gap: 12,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: authColors.textPrimary,
  },
  stepDesc: {
    fontSize: 13,
    color: authColors.textMuted,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  categoryIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  categorySub: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  attendanceBox: {
    backgroundColor: authColors.inputBg,
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  attendanceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginBottom: 6,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attendanceLabel: {
    fontSize: 12,
    color: authColors.textMuted,
  },
  attendanceBadge: {
    fontSize: 12,
    fontWeight: "700",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  linkText: {
    color: authColors.roleAccent,
    fontSize: 12,
    fontWeight: "600",
  },
  recentReportCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginBottom: 8,
  },
  recentReportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentReportId: {
    fontSize: 13,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  recentReportTitle: {
    fontSize: 13,
    color: authColors.textSecondary,
    marginTop: 4,
  },
  recentReportDate: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  badgeProgress: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeProgressText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
  },
  badgeResolved: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeResolvedText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },

  backLink: { marginBottom: 8 },
  backLinkText: { color: authColors.roleAccent, fontSize: 13, fontWeight: "600" },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    backgroundColor: authColors.inputBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  typeOptionActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  typeOptionText: { fontSize: 12, color: authColors.textMuted },
  typeOptionTextActive: { color: authColors.roleAccent, fontWeight: "700" },
  textArea: {
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    padding: 12,
    color: authColors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    textAlignVertical: "top",
    height: 90,
  },
  photoRow: { flexDirection: "row", gap: 10, marginVertical: 4 },
  photoAddBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: authColors.cardBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: authColors.inputBg,
  },
  photoPlus: { fontSize: 24, color: authColors.textMuted },
  photoAddText: { fontSize: 10, color: authColors.textMuted, marginTop: 2 },
  severityRow: { flexDirection: "row", gap: 8 },
  severityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: authColors.inputBg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  severityBtnActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  severityText: { color: authColors.textMuted, fontSize: 13, fontWeight: "600" },
  severityTextActive: { color: "#FFFFFF" },

  primaryBtn: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  confirmationSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 2,
    borderColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkIcon: { fontSize: 32, color: "#10B981", fontWeight: "800" },
  confirmTitle: { fontSize: 22, fontWeight: "800", color: authColors.textPrimary },
  confirmSub: { fontSize: 13, color: authColors.textMuted, marginTop: 4, marginBottom: 20 },
  confirmSummaryCard: {
    width: "100%",
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginBottom: 16,
  },
  confirmSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
    paddingBottom: 12,
    marginBottom: 12,
  },
  confirmLabel: { fontSize: 11, color: authColors.textMuted },
  confirmVal: { fontSize: 14, fontWeight: "700", color: authColors.textPrimary, marginTop: 2 },
  timelineTitle: { fontSize: 13, fontWeight: "700", color: authColors.textPrimary, marginBottom: 10 },
  timelineItem: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "center" },
  timelineIcon: { fontSize: 16 },
  timelineName: { fontSize: 13, fontWeight: "600", color: authColors.textPrimary },
  timelineTime: { fontSize: 11, color: authColors.textMuted },
});
