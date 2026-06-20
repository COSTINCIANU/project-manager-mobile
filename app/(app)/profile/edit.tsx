// =====================================================
// EditProfileScreen — Modifier son profil
// Permet de changer son nom, email et mot de passe
// Utilise la route PUT /api/auth/profile
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!email.trim()) {
      Alert.alert("Champ requis", "L'email est obligatoire.");
      return;
    }
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        Alert.alert("Champ requis", "Entrez votre mot de passe actuel.");
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert("Mot de passe trop court", "Minimum 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const payload: any = { name: name.trim() || null, email: email.trim() };
      if (newPassword && currentPassword) {
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
      }
      const { data } = await apiClient.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        payload,
      );
      if (user) {
        setUser({ ...user, name: data.name, email: data.email });
      }
      Alert.alert("Succes", "Profil mis a jour !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de modifier le profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundPrimary,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: Colors.danger }]}>
            ✕ Annuler
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Modifier le profil
        </Text>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isSubmitting}
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            isSubmitting && styles.saveButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Sauver</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section informations personnelles */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Informations personnelles
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Nom
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Votre nom complet..."
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Email <Text style={{ color: Colors.danger }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="votre@email.com"
              placeholderTextColor={theme.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />
          </View>
        </View>

        {/* Section changement de mot de passe */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Changer le mot de passe
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textTertiary }]}>
            Laissez vide si vous ne souhaitez pas changer votre mot de passe
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Mot de passe actuel
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.textTertiary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Nouveau mot de passe
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Minimum 6 caracteres"
              placeholderTextColor={theme.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Confirmer le mot de passe
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
                confirmPassword && newPassword !== confirmPassword
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Repetez le nouveau mot de passe"
              placeholderTextColor={theme.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              maxLength={100}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>
                Les mots de passe ne correspondent pas
              </Text>
            )}
          </View>
        </View>

        {/* Info sur le role */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: Colors.info + "15",
              borderColor: Colors.info + "40",
            },
          ]}
        >
          <Text style={[styles.infoText, { color: Colors.info }]}>
            💡 Le role ne peut pas etre modifie ici.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================
// STYLES — valeurs fixes uniquement
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 17, fontWeight: "600" },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  content: { padding: 20, gap: 16 },
  section: { borderRadius: 16, padding: 16, gap: 14, borderWidth: 0.5 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  sectionSubtitle: { fontSize: 12, marginTop: -8 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 2 },
  infoBox: { borderRadius: 10, padding: 14, borderWidth: 0.5 },
  infoText: { fontSize: 13, lineHeight: 18 },
});
