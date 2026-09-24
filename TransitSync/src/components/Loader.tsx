import React from "react";
import { StyleSheet, View, Text, ActivityIndicator, Modal } from "react-native";
import { authColors } from "../colors/colors";

interface LoaderProps {
  show: boolean;
  text?: string;
}

export default function Loader({ show, text = "Loading..." }: LoaderProps) {
  return (
    <Modal transparent animationType="fade" visible={show}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={authColors.roleAccent} />
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 24,
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    alignItems: "center",
    minWidth: 150,
  },
  text: {
    marginTop: 12,
    color: authColors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
