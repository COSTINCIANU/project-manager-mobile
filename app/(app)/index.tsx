import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";

export default function DashboardScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour, {user ? user.firstName : "…"} 👋
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Phase 1 terminée ✅{"\n"}
            Les projets et tâches arrivent en Phase 2.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20 },
  header: { gap: 4 },
  greeting: { fontSize: 26, fontWeight: "700", color: Colors.textPrimary },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  placeholder: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: "center",
  },
});
