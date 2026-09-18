import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  NativeModules,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { authColors } from "../colors/colors";

const VEHICLES = ["VAN-05", "TRUCK-11", "MINI-03", "TRK-12", "VAN-09"];
const TRIPS = ["TR001", "TR004", "TR005", "TR006"];

const getTodayString = () => new Date().toISOString().split("T")[0];

import { requestStoragePermission } from "../utils/permissions";

// Safe loader for react-native-fs to prevent runtime crash when native module isn't linked yet
const getRNFS = () => {
  try {
    if (NativeModules.RNFSManager) {
      return require("react-native-fs");
    }
  } catch (e) {
    // Native module not available in current build
  }
  return null;
};

export default function ExpenseScreen() {
  const [activeTab, setActiveTab] = useState<"FUEL" | "EXPENSE">("FUEL");
  const [fuelModalVisible, setFuelModalVisible] = useState(false);
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"TODAY" | "WEEK" | "MONTH" | "ALL" | "CUSTOM">("TODAY");
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [tempStartDate, setTempStartDate] = useState(getTodayString());
  const [tempEndDate, setTempEndDate] = useState(getTodayString());

  // Lists State
  const todayStr = getTodayString();
  const [fuelLogs, setFuelLogs] = useState([
    { id: 1, vehicle: "VAN-05", date: todayStr, liters: 42, cost: 3150, notes: "Regular fuel refill" },
    { id: 2, vehicle: "TRUCK-11", date: todayStr, liters: 110, cost: 8400, notes: "Full tank for inter-city trip" },
    { id: 3, vehicle: "MINI-03", date: "2026-08-20", liters: 28, cost: 2050, notes: "Local deliveries" },
    { id: 4, vehicle: "TRK-12", date: "2026-08-15", liters: 95, cost: 7200, notes: "Highway halt refill" },
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, trip: "TR001", vehicle: "VAN-05", date: todayStr, toll: 120, other: 150, maint: 0, notes: "Toll & parking pass" },
    { id: 2, trip: "TR005", vehicle: "TRK-12", date: todayStr, toll: 340, other: 200, maint: 18000, notes: "Engine tuning & highway toll" },
    { id: 3, trip: "TR004", vehicle: "MINI-03", date: "2026-08-21", toll: 80, other: 50, maint: 0, notes: "State border entry toll" },
  ]);

  // Form State - Fuel
  const [fuelVehicle, setFuelVehicle] = useState(VEHICLES[0]);
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [fuelNotes, setFuelNotes] = useState("");

  // Form State - Expenses
  const [expTrip, setExpTrip] = useState(TRIPS[0]);
  const [expVehicle, setExpVehicle] = useState(VEHICLES[0]);
  const [expToll, setExpToll] = useState("");
  const [expOther, setExpOther] = useState("");
  const [expMaint, setExpMaint] = useState("");
  const [expNotes, setExpNotes] = useState("");

  const inr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  // Date Filtering Logic
  const filteredFuelLogs = useMemo(() => {
    const today = new Date();
    const query = searchQuery.trim().toLowerCase();

    return fuelLogs.filter((log) => {
      // 1. Text Search Filter
      const matchesSearch =
        !query ||
        log.vehicle.toLowerCase().includes(query) ||
        log.date.includes(query) ||
        log.liters.toString().includes(query) ||
        log.cost.toString().includes(query) ||
        (log.notes && log.notes.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Date Filter
      const logDate = new Date(log.date);

      if (datePreset === "TODAY") {
        return log.date === todayStr;
      }
      if (datePreset === "WEEK") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return logDate >= weekAgo && logDate <= today;
      }
      if (datePreset === "MONTH") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return logDate >= monthAgo && logDate <= today;
      }
      if (datePreset === "CUSTOM") {
        return log.date >= startDate && log.date <= endDate;
      }
      return true; // "ALL"
    });
  }, [fuelLogs, searchQuery, datePreset, startDate, endDate, todayStr]);

  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const query = searchQuery.trim().toLowerCase();

    return expenses.filter((exp) => {
      const total = exp.toll + exp.other + exp.maint;
      const matchesSearch =
        !query ||
        exp.vehicle.toLowerCase().includes(query) ||
        exp.trip.toLowerCase().includes(query) ||
        exp.date.includes(query) ||
        total.toString().includes(query) ||
        (exp.notes && exp.notes.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const expDate = new Date(exp.date);

      if (datePreset === "TODAY") {
        return exp.date === todayStr;
      }
      if (datePreset === "WEEK") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return expDate >= weekAgo && expDate <= today;
      }
      if (datePreset === "MONTH") {
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return expDate >= monthAgo && expDate <= today;
      }
      if (datePreset === "CUSTOM") {
        return exp.date >= startDate && exp.date <= endDate;
      }
      return true; // "ALL"
    });
  }, [expenses, searchQuery, datePreset, startDate, endDate, todayStr]);

  // Export to Excel / CSV safely
  const handleExportToExcel = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission && Platform.OS === "android") {
        Alert.alert("Permission Denied", "Storage permission is required to save the Excel file to your device.");
        return;
      }

      let csvContent = "\uFEFF"; // UTF-8 BOM for Microsoft Excel compatibility
      let fileName = "";
      let recordCount = 0;

      if (activeTab === "FUEL") {
        if (filteredFuelLogs.length === 0) {
          Alert.alert("No Data", "There are no fuel logs to export for the selected filter.");
          return;
        }

        fileName = `Transit_Fuel_Logs_${getTodayString()}.csv`;
        csvContent += "ID,Date,Vehicle,Volume (Liters),Cost (INR),Notes\n";

        filteredFuelLogs.forEach((log) => {
          const safeNotes = `"${(log.notes || "").replace(/"/g, '""')}"`;
          csvContent += `${log.id},${log.date},${log.vehicle},${log.liters},${log.cost},${safeNotes}\n`;
        });
        recordCount = filteredFuelLogs.length;
      } else {
        if (filteredExpenses.length === 0) {
          Alert.alert("No Data", "There are no trip expenses to export for the selected filter.");
          return;
        }

        fileName = `Transit_Trip_Expenses_${getTodayString()}.csv`;
        csvContent += "ID,Date,Trip ID,Vehicle,Toll Charges (INR),Maintenance (INR),Other Charges (INR),Total Cost (INR),Notes\n";

        filteredExpenses.forEach((exp) => {
          const total = exp.toll + exp.maint + exp.other;
          const safeNotes = `"${(exp.notes || "").replace(/"/g, '""')}"`;
          csvContent += `${exp.id},${exp.date},${exp.trip},${exp.vehicle},${exp.toll},${exp.maint},${exp.other},${total},${safeNotes}\n`;
        });
        recordCount = filteredExpenses.length;
      }

      const RNFS = getRNFS();

      if (!RNFS) {
        Alert.alert(
          "Export Prepared 📊",
          `Generated ${fileName} containing ${recordCount} records.\n\nNote: Native file writing requires a fresh build ('npm run android') to access device storage.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Determine export path: Android Downloads directory or iOS Documents directory
      const baseDir =
        Platform.OS === "android"
          ? RNFS.DownloadDirectoryPath || RNFS.ExternalDirectoryPath
          : RNFS.DocumentDirectoryPath;

      const filePath = `${baseDir}/${fileName}`;

      await RNFS.writeFile(filePath, csvContent, "utf8");

      Alert.alert(
        "Export Successful! 📊",
        `Excel spreadsheet downloaded successfully.\n\nSaved to:\n${filePath}`,
        [{ text: "OK" }]
      );
    } catch (err: any) {
      console.error("Export Error:", err);
      Alert.alert("Export Error", err.message || "Failed to download Excel file.");
    }
  };

  const handleSaveFuel = () => {
    if (!fuelLiters || !fuelCost) {
      Alert.alert("Error", "Please fill in liters and cost fields");
      return;
    }
    const newLog = {
      id: Date.now(),
      vehicle: fuelVehicle,
      date: getTodayString(),
      liters: Number(fuelLiters),
      cost: Number(fuelCost),
      notes: fuelNotes.trim(),
    };
    setFuelLogs((prev) => [newLog, ...prev]);
    setFuelLiters("");
    setFuelCost("");
    setFuelNotes("");
    setFuelModalVisible(false);
    Alert.alert("Success", "Refueling log saved successfully");
  };

  const handleSaveExpense = () => {
    if (!expToll && !expOther && !expMaint) {
      Alert.alert("Error", "Please enter at least one expense amount");
      return;
    }
    const newExp = {
      id: Date.now(),
      trip: expTrip,
      vehicle: expVehicle,
      date: getTodayString(),
      toll: Number(expToll) || 0,
      other: Number(expOther) || 0,
      maint: Number(expMaint) || 0,
      notes: expNotes.trim(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    setExpToll("");
    setExpOther("");
    setExpMaint("");
    setExpNotes("");
    setExpModalVisible(false);
    Alert.alert("Success", "Transit expenses logged");
  };

  const applyCustomDates = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setDatePreset("CUSTOM");
    setDateModalVisible(false);
  };

  const getCostPillColor = (amount: number) => {
    if (amount === 0) return { text: authColors.textMuted, bg: authColors.inputBg, border: authColors.cardBorder };
    if (amount < 1000) return { text: authColors.success, bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" };
    if (amount < 10000) return { text: authColors.roleAccent, bg: "rgba(255,176,32,0.12)", border: "rgba(255,176,32,0.25)" };
    return { text: authColors.error, bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.25)" };
  };

  return (
    <ScreenWrapper title="Transit Expenses">
      <View style={styles.container}>
        {/* Switch Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "FUEL" && styles.tabButtonActive]}
            onPress={() => setActiveTab("FUEL")}
          >
            <Text style={[styles.tabButtonText, activeTab === "FUEL" && styles.tabButtonTextActive]}>
              ⛽ Fuel Log
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "EXPENSE" && styles.tabButtonActive]}
            onPress={() => setActiveTab("EXPENSE")}
          >
            <Text style={[styles.tabButtonText, activeTab === "EXPENSE" && styles.tabButtonTextActive]}>
              💰 Trip Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Controls */}
        <View style={styles.filterSection}>
          {/* Search Box */}
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by vehicle, trip ID, or notes..."
              placeholderTextColor={authColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Date Filter Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilterScroll}>
            <TouchableOpacity
              style={[styles.dateChip, datePreset === "TODAY" && styles.dateChipActive]}
              onPress={() => setDatePreset("TODAY")}
            >
              <Text style={[styles.dateChipText, datePreset === "TODAY" && styles.dateChipTextActive]}>
                📅 Today ({todayStr})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateChip, datePreset === "WEEK" && styles.dateChipActive]}
              onPress={() => setDatePreset("WEEK")}
            >
              <Text style={[styles.dateChipText, datePreset === "WEEK" && styles.dateChipTextActive]}>
                🗓️ This Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateChip, datePreset === "MONTH" && styles.dateChipActive]}
              onPress={() => setDatePreset("MONTH")}
            >
              <Text style={[styles.dateChipText, datePreset === "MONTH" && styles.dateChipTextActive]}>
                📆 This Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateChip, datePreset === "ALL" && styles.dateChipActive]}
              onPress={() => setDatePreset("ALL")}
            >
              <Text style={[styles.dateChipText, datePreset === "ALL" && styles.dateChipTextActive]}>
                ♾️ All Time
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateChip, datePreset === "CUSTOM" && styles.dateChipActive]}
              onPress={() => setDateModalVisible(true)}
            >
              <Text style={[styles.dateChipText, datePreset === "CUSTOM" && styles.dateChipTextActive]}>
                ⚙️ Custom Range {datePreset === "CUSTOM" ? `(${startDate} to ${endDate})` : ""}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {activeTab === "FUEL" ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Fuel Register</Text>
                <Text style={styles.panelSubtitle}>Showing {filteredFuelLogs.length} records</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.exportButton} onPress={handleExportToExcel}>
                  <Text style={styles.exportButtonText}>📊 Export Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => setFuelModalVisible(true)}>
                  <Text style={styles.addButtonText}>+ Log Fuel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollList}>
              {filteredFuelLogs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>⛽</Text>
                  <Text style={styles.emptyTitle}>No Refueling Logs Found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your search query or selecting a different date range filter.
                  </Text>
                </View>
              ) : (
                filteredFuelLogs.map((log) => {
                  const colors = getCostPillColor(log.cost);
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.cardInfo}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardTitle}>{log.vehicle}</Text>
                          <Text style={styles.cardDate}>{log.date}</Text>
                        </View>
                        <Text style={styles.cardSubtitle}>Volume: {log.liters} Liters</Text>
                        {log.notes ? <Text style={styles.cardNotes}>Note: {log.notes}</Text> : null}
                      </View>
                      <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={[styles.pillText, { color: colors.text }]}>{inr(log.cost)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>Operational Expenses</Text>
                <Text style={styles.panelSubtitle}>Showing {filteredExpenses.length} records</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.exportButton} onPress={handleExportToExcel}>
                  <Text style={styles.exportButtonText}>📊 Export Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => setExpModalVisible(true)}>
                  <Text style={styles.addButtonText}>+ Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollList}>
              {filteredExpenses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💰</Text>
                  <Text style={styles.emptyTitle}>No Operational Expenses Found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your search query or selecting a different date range filter.
                  </Text>
                </View>
              ) : (
                filteredExpenses.map((exp) => {
                  const total = exp.toll + exp.other + exp.maint;
                  const colors = getCostPillColor(total);
                  return (
                    <View key={exp.id} style={styles.logCard}>
                      <View style={styles.cardInfo}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardTitle}>{exp.vehicle} ({exp.trip})</Text>
                          <Text style={styles.cardDate}>{exp.date}</Text>
                        </View>
                        <Text style={styles.cardSubtitle}>
                          Toll: {inr(exp.toll)} | Misc: {inr(exp.other)} | Maint: {inr(exp.maint)}
                        </Text>
                        {exp.notes ? <Text style={styles.cardNotes}>Note: {exp.notes}</Text> : null}
                      </View>
                      <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={[styles.pillText, { color: colors.text }]}>{inr(total)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        )}

        {/* Custom Date Range Modal */}
        <Modal
          visible={dateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Custom Date Range</Text>
                <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formPadding}>
                <Text style={styles.formLabel}>Start Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="2026-08-01"
                  placeholderTextColor={authColors.textMuted}
                  value={tempStartDate}
                  onChangeText={setTempStartDate}
                />

                <Text style={styles.formLabel}>End Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="2026-08-23"
                  placeholderTextColor={authColors.textMuted}
                  value={tempEndDate}
                  onChangeText={setTempEndDate}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setDateModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={applyCustomDates}>
                    <Text style={styles.saveBtnText}>Apply Filter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Fuel Log Modal */}
        <Modal
          visible={fuelModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFuelModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Refueling Log Entry</Text>
                <TouchableOpacity onPress={() => setFuelModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formPadding}>
                <Text style={styles.formLabel}>Select Vehicle *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizList}>
                  {VEHICLES.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.selectChip, fuelVehicle === v && styles.selectChipActive]}
                      onPress={() => setFuelVehicle(v)}
                    >
                      <Text style={[styles.chipText, fuelVehicle === v && styles.chipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.formLabel}>Fuel Volume (Liters) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 45"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={fuelLiters}
                  onChangeText={setFuelLiters}
                />

                <Text style={styles.formLabel}>Fuel Cost (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 3500"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={fuelCost}
                  onChangeText={setFuelCost}
                />

                <Text style={styles.formLabel}>Remarks / Notes</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Refill station details, odometer, etc."
                  placeholderTextColor={authColors.textMuted}
                  value={fuelNotes}
                  onChangeText={setFuelNotes}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setFuelModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFuel}>
                    <Text style={styles.saveBtnText}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Expenses Modal */}
        <Modal
          visible={expModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setExpModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Trip Operations Expense</Text>
                <TouchableOpacity onPress={() => setExpModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formPadding}>
                <Text style={styles.formLabel}>Linked Trip ID *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizList}>
                  {TRIPS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.selectChip, expTrip === t && styles.selectChipActive]}
                      onPress={() => setExpTrip(t)}
                    >
                      <Text style={[styles.chipText, expTrip === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.formLabel}>Vehicle *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizList}>
                  {VEHICLES.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.selectChip, expVehicle === v && styles.selectChipActive]}
                      onPress={() => setExpVehicle(v)}
                    >
                      <Text style={[styles.chipText, expVehicle === v && styles.chipTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.formLabel}>Toll Plaza Charges (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 150"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={expToll}
                  onChangeText={setExpToll}
                />

                <Text style={styles.formLabel}>Maintenance Cost (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 15000"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={expMaint}
                  onChangeText={setExpMaint}
                />

                <Text style={styles.formLabel}>Other / Misc Charges (₹)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 100"
                  placeholderTextColor={authColors.textMuted}
                  keyboardType="numeric"
                  value={expOther}
                  onChangeText={setExpOther}
                />

                <Text style={styles.formLabel}>Remarks / Notes</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Additional details..."
                  placeholderTextColor={authColors.textMuted}
                  value={expNotes}
                  onChangeText={setExpNotes}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setExpModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveExpense}>
                    <Text style={styles.saveBtnText}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: authColors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  tabButtonText: {
    fontSize: 13,
    color: authColors.textSecondary,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  filterSection: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: authColors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: authColors.textMuted,
    paddingHorizontal: 4,
  },
  dateFilterScroll: {
    flexGrow: 0,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginRight: 8,
  },
  dateChipActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: authColors.roleActiveBg,
  },
  dateChipText: {
    fontSize: 12,
    color: authColors.textSecondary,
  },
  dateChipTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  panel: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  panelSubtitle: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  exportButton: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: authColors.logoRing,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportButtonText: {
    color: authColors.logoRing,
    fontSize: 12,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#1a1200",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollList: {
    gap: 12,
    paddingBottom: 24,
  },
  logCard: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  cardDate: {
    fontSize: 11,
    color: authColors.textMuted,
  },
  cardSubtitle: {
    fontSize: 12,
    color: authColors.textSecondary,
    marginTop: 4,
  },
  cardNotes: {
    fontSize: 11,
    color: authColors.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: authColors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: authColors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  modalCloseIcon: {
    fontSize: 20,
    color: authColors.textMuted,
  },
  formPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: authColors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  formInput: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: authColors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  horizList: {
    flexGrow: 0,
    marginBottom: 16,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    marginRight: 8,
  },
  selectChipActive: {
    borderColor: authColors.roleAccent,
    backgroundColor: authColors.roleActiveBg,
  },
  chipText: {
    fontSize: 12,
    color: authColors.textSecondary,
  },
  chipTextActive: {
    color: authColors.roleAccent,
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: authColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 2,
    backgroundColor: authColors.roleAccent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#1a1200",
    fontSize: 14,
    fontWeight: "700",
  },
});
