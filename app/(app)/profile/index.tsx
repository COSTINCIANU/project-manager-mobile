// =====================================================
// ProfileScreen — Écran profil utilisateur
// Affiche les informations du compte connecté
// et permet de se déconnecter
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";
import { getUserInitials, getUserFullName } from "@/types/user";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  // Confirmation avant déconnexion
  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête profil */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Avatar et nom */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
          </View>
          {/* Affiche le nom complet ou l'email si pas de nom */}
          <Text style={styles.userName}>{getUserFullName(user)}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
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
            <Text style={styles.infoLabel}>Rôle</Text>
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

        {/* Bouton déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
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

  // En-tête
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
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

  // Bouton déconnexion
  logoutButton: {
    height: 52,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
