// =====================================================
// EditProfileScreen — Modifier son profil
// Permet de changer son nom et son email
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Soumet les modifications du profil
  const handleUpdate = async () => {
    if (!email.trim()) {
      Alert.alert("Champ requis", "L'email est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Envoie les modifications au backend Symfony
      const { data } = await apiClient.put(API_ENDPOINTS.UPDATE_PROFILE, {
        name: name.trim() || null,
        email: email.trim(),
      });

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
        {/* Champ nom */}
        <View style={styles.field}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre nom complet..."
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
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

        {/* Info sur le role — non modifiable */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Le role et le mot de passe ne peuvent pas etre modifies ici.
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
  content: { padding: 20, gap: 20 },

  // Champs
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  required: { color: Colors.danger },
  input: {
    backgroundColor: Colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
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
