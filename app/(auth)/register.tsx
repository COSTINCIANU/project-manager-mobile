// =====================================================
// RegisterScreen — Ecran d'inscription
// Fonctionnalite disponible prochainement
// Theme clair/sombre automatique selon le systeme
// =====================================================

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function RegisterScreen() {
  const router = useRouter();
  // Hook theme — retourne les couleurs selon le mode clair/sombre
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Créer un compte</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Fonctionnalité disponible prochainement.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =====================
// STYLES — valeurs fixes uniquement
// Les couleurs sont appliquees dynamiquement via theme
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15 },
  backButton: { marginTop: 8 },
  backText: { fontSize: 14 },
});
