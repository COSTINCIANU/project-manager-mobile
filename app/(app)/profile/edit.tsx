// =====================================================
// EditProfileScreen — Modifier son profil
// Permet de changer son nom, email et mot de passe
// Utilise la route PUT /api/auth/profile
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
import { Colors } from "@/constants/colors";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  // Champs du formulaire pre-remplis avec les donnees actuelles
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Champs mot de passe — vides par defaut pour securite
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Soumet les modifications du profil
  const handleUpdate = async () => {
    // Validation email obligatoire
    if (!email.trim()) {
      Alert.alert("Champ requis", "L'email est obligatoire.");
      return;
    }

    // Validation mot de passe si l'utilisateur veut le changer
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
      // Prepare le payload — inclut le mot de passe seulement si renseigne
      const payload: any = {
        name: name.trim() || null,
        email: email.trim(),
      };

      // Ajoute le mot de passe au payload seulement si l'utilisateur veut le changer
      if (newPassword && currentPassword) {
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
      }

      // Envoie les modifications au backend Symfony
      const { data } = await apiClient.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        payload,
      );

      // Met a jour le store avec les nouvelles informations
      if (user) {
        setUser({ ...user, name: data.name, email: data.email });
      }

      Alert.alert("Succes", "Profil mis a jour !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.log("Erreur modification profil:", error?.response?.data);
      Alert.alert("Erreur", "Impossible de modifier le profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>✕ Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le profil</Text>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isSubmitting}
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>

          {/* Champ nom */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre nom complet..."
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
          </View>

          {/* Champ email */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />
          </View>
        </View>

        {/* Section changement de mot de passe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
          <Text style={styles.sectionSubtitle}>
            Laissez vide si vous ne souhaitez pas changer votre mot de passe
          </Text>

          {/* Mot de passe actuel */}
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textTertiary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              maxLength={100}
            />
          </View>

          {/* Nouveau mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 caracteres"
              placeholderTextColor={Colors.textTertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              maxLength={100}
            />
          </View>

          {/* Confirmation nouveau mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              style={[
                styles.input,
                // Rouge si les mots de passe ne correspondent pas
                confirmPassword && newPassword !== confirmPassword
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Repetez le nouveau mot de passe"
              placeholderTextColor={Colors.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              maxLength={100}
            />
            {/* Message d'erreur si les mots de passe ne correspondent pas */}
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>
                Les mots de passe ne correspondent pas
              </Text>
            )}
          </View>
        </View>

        {/* Info sur le role */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Le role ne peut pas etre modifie ici.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },

  // En-tete
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15, color: Colors.danger },
  title: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },

  // Contenu
  content: { padding: 20, gap: 16 },

  // Sections
  section: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: -8,
  },

  // Champs
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  required: { color: Colors.danger },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 2,
  },

  // Info box
  infoBox: {
    backgroundColor: Colors.info + "15",
    borderRadius: 10,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.info + "40",
  },
  infoText: { fontSize: 13, color: Colors.info, lineHeight: 18 },
});
