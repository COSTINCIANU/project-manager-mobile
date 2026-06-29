import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>Fonctionnalité disponible prochainement.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundPrimary },
  inner: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  backButton: { marginTop: 8 },
  backText: { fontSize: 14, color: Colors.primary },
});
