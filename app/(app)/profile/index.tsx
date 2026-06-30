// =====================================================
// ProfileScreen — Ecran profil utilisateur
// Affiche les informations du compte connecte
// Permet de changer son avatar via la galerie photo
// Theme clair/sombre automatique selon le systeme
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
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
import { getUserInitials } from "@/types/user";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useRouter } from "expo-router";

import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuthStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const router = useRouter();
  // Hook theme pour les couleurs adaptees et le toggle
  const { isDark, toggleTheme, theme } = useTheme();

  const { isTablet } = useBreakpoint();

  // Confirmation avant deconnexion
  const handleLogout = () => {
    Alert.alert("Deconnexion", "Voulez-vous vraiment vous deconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Deconnecter", style: "destructive", onPress: logout },
    ]);
  };

  // Ouvre la galerie photo et uploade l'avatar selectionne
  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusee", "Autorisez l'acces a vos photos dans les reglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const image = result.assets[0];
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: image.uri,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);
      const { data } = await apiClient.post(API_ENDPOINTS.AVATAR, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.avatar && user) {
        setUser({ ...user, avatar: data.avatar });
        Alert.alert("Succes", "Avatar mis a jour !");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre a jour l'avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // =====================
  // RGPD — EXPORT DES DONNÉES
  // =====================
  const handleExportData = async () => {
    try {
      const { data } = await apiClient.get("/api/user/export");

      const fileName = `mes-donnees-${new Date().toISOString().split("T")[0]}.json`;
      const file = new File(Paths.document, fileName);

      file.write(JSON.stringify(data, null, 2));

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Exporter mes données",
        });
      } else {
        Alert.alert("Export réussi", `Fichier enregistré : ${fileName}`);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'exporter vos données.");
    }
  };
  // =====================
  // RGPD — SUPPRESSION DE COMPTE
  // =====================
  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer mon compte",
      "Cette action est irréversible. Toutes vos données personnelles seront supprimées définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete("/api/user/me");
              await logout();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le compte.");
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  const avatarUrl = user.avatar ? `https://api.costincianu.fr${user.avatar}` : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tete */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Profil</Text>
        </View>

        {/* Section avatar + nom */}
        <View
          style={[
            styles.avatarSection,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleAvatarChange}
            disabled={uploadingAvatar}
            style={styles.avatarContainer}
          >
            {uploadingAvatar ? (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
              </View>
            )}
            {/* Badge modifier */}
            <View
              style={[
                styles.avatarEditBadge,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={styles.avatarEditText}>📷</Text>
            </View>
          </TouchableOpacity>

          {user.name ? (
            <>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{user.name}</Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
            </>
          ) : (
            <Text style={[styles.userName, { color: theme.textPrimary }]}>{user.email}</Text>
          )}

          {/* Badge role */}
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + "20" }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>
              {user.role === "admin" ? "👑 Admin" : "👤 Utilisateur"}
            </Text>
          </View>
        </View>

        {/* Informations du compte */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Informations</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{user.email}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nom</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{user.name || "—"}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Role</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {user.role === "admin" ? "Administrateur" : "Utilisateur"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Membre depuis</Text>
            <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "—"}
            </Text>
          </View>
        </View>

        {/* Bouton theme clair/sombre */}
        <TouchableOpacity
          style={[
            styles.themeButton,
            {
              backgroundColor: isDark ? Colors.warning + "20" : theme.primary + "15",
              borderColor: theme.border,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={[styles.themeButtonText, { color: theme.textPrimary }]}>
            {isDark ? "☀️ Mode clair" : "🌙 Mode sombre"}
          </Text>
        </TouchableOpacity>

        {/* Bouton modifier le profil */}
        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push("/(app)/profile/edit" as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileText}>✏️ Modifier le profil</Text>
        </TouchableOpacity>

        {/* Bouton abonnement */}
        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: "#9B7FD4" }]}
          onPress={() => router.push("/(app)/subscription" as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileText}>💳 Mon abonnement</Text>
        </TouchableOpacity>

        {/* Bouton historique */}
        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: "#378ADD" }]}
          onPress={() => router.push("/(app)/profile/history" as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.editProfileText}>📋 Historique des actions</Text>
        </TouchableOpacity>

        {/* Bouton export RGPD */}
        <TouchableOpacity
          style={[
            styles.editProfileButton,
            { backgroundColor: theme.backgroundPrimary, borderWidth: 1, borderColor: theme.border },
          ]}
          onPress={handleExportData}
          activeOpacity={0.8}
        >
          <Text style={[styles.editProfileText, { color: theme.textPrimary }]}>
            📥 Exporter mes données
          </Text>
        </TouchableOpacity>

        {/* Bouton supprimer compte RGPD */}
        <TouchableOpacity
          style={[
            styles.editProfileButton,
            { backgroundColor: Colors.danger + "15", borderWidth: 1, borderColor: Colors.danger },
          ]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Text style={[styles.editProfileText, { color: Colors.danger }]}>
            🗑️ Supprimer mon compte
          </Text>
        </TouchableOpacity>

        {/* Bouton deconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================
// STYLES — valeurs fixes uniquement
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 20 },
  header: { marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  avatarSection: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
  },
  avatarContainer: { position: "relative", marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
  },
  avatarEditText: { fontSize: 13 },
  userName: { fontSize: 20, fontWeight: "600" },
  userEmail: { fontSize: 14 },
  roleBadge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: "500" },
  section: { borderRadius: 16, padding: 16, borderWidth: 0.5 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
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
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "500" },
  divider: { height: 0.5 },
  themeButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  themeButtonText: { fontSize: 16, fontWeight: "600" },
  editProfileButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  editProfileText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  logoutButton: {
    height: 52,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  contentTablet: {
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
    padding: 32,
  },
});
