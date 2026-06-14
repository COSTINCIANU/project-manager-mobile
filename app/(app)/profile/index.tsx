// =====================================================
// ProfileScreen — Ecran profil utilisateur
// Affiche les informations du compte connecté
// Permet de changer son avatar via la galerie photo
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";
import { getUserInitials, getUserFullName } from "@/types/user";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Confirmation avant deconnexion
  const handleLogout = () => {
    Alert.alert("Deconnexion", "Voulez-vous vraiment vous deconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Deconnecter", style: "destructive", onPress: logout },
    ]);
  };

  // Ouvre la galerie photo et uploade l'avatar selectionne
  const handleAvatarChange = async () => {
    // Demande la permission d'acces a la galerie
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusee",
        "Autorisez l'acces a vos photos dans les reglages.",
      );
      return;
    }

    // Ouvre le selecteur d'image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permet de recadrer l'image
      aspect: [1, 1], // Format carre pour l'avatar
      quality: 0.8, // Qualite de compression
    });

    // Si l'utilisateur a annule, on arrete
    if (result.canceled) return;

    const image = result.assets[0];
    setUploadingAvatar(true);

    try {
      // Prepare le FormData pour l'envoi multipart
      const formData = new FormData();
      formData.append("avatar", {
        uri: image.uri,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);

      // Envoie l'avatar au backend Symfony
      const { data } = await apiClient.post(API_ENDPOINTS.AVATAR, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Met a jour le profil avec le nouvel avatar
      if (data.avatar && user) {
        setUser({ ...user, avatar: data.avatar });
        Alert.alert("Succes", "Avatar mis a jour !");
      }
    } catch (error) {
      console.log("Erreur upload avatar:", error);
      Alert.alert("Erreur", "Impossible de mettre a jour l'avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  // URL complete de l'avatar si defini
  const avatarUrl = user.avatar
    ? `https://api.costincianu.fr${user.avatar}`
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tete */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Section avatar + nom */}
        <View style={styles.avatarSection}>
          {/* Avatar cliquable pour changer la photo */}
          <TouchableOpacity
            onPress={handleAvatarChange}
            disabled={uploadingAvatar}
            style={styles.avatarContainer}
          >
            {uploadingAvatar ? (
              // Indicateur de chargement pendant l'upload
              <View style={styles.avatar}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : avatarUrl ? (
              // Photo de profil si definie
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              // Initiales par defaut
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
              </View>
            )}
            {/* Indicateur "modifier" en bas de l'avatar */}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditText}>📷</Text>
            </View>
          </TouchableOpacity>

          {/* Nom et email */}
          <Text style={styles.userName}>{getUserFullName(user)}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          {/* Badge role */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === "admin" ? "👑 Admin" : "👤 Utilisateur"}
            </Text>
          </View>
        </View>

        {/* Informations du compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{user.name || "—"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {user.role === "admin" ? "Administrateur" : "Utilisateur"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membre depuis</Text>
            <Text style={styles.infoValue}>
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("fr-FR")
                : "—"}
            </Text>
          </View>
        </View>

        {/* Bouton deconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  content: { padding: 20, gap: 20 },

  // En-tete
  header: { marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },

  // Section avatar
  avatarSection: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  avatarContainer: { position: "relative", marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.backgroundPrimary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  avatarEditText: { fontSize: 13 },
  userName: { fontSize: 20, fontWeight: "600", color: Colors.textPrimary },
  userEmail: { fontSize: 14, color: Colors.textSecondary },
  roleBadge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.primary + "20",
    borderRadius: 20,
  },
  roleText: { fontSize: 13, color: Colors.primary, fontWeight: "500" },

  // Section infos
  section: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoLabel: { fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: "500" },
  divider: { height: 0.5, backgroundColor: Colors.border },

  // Bouton deconnexion
  logoutButton: {
    height: 52,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
