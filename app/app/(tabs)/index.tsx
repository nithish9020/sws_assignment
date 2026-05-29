import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

export default function UploadScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="headlineMedium" style={{ color: colors.primary }}>
        Upload
      </Text>
      <Text variant="bodyMedium" style={styles.sub}>
        Phase 1 — file picker & upload queue
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sub: {
    marginTop: 8,
    color: "#6B7B8D",
  },
});
