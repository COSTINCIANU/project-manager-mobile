import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function TasksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Tâches</Text>
        <Text style={styles.subtitle}>Disponible en Phase 2.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundPrimary },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
});
