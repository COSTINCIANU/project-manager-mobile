// =====================================================
// TeamScreen — Gestion de l'equipe du projet
// Affiche les membres invites et permet d'en inviter
// de nouveaux en entrant leur email
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";

// Type pour une invitation
interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("dev");
  const [isSending, setIsSending] = useState(false);

  // Roles disponibles dans le projet
  const ROLES = [
    { value: "dev", label: "👨‍💻 Developpeur" },
    { value: "manager", label: "📋 Manager" },
    { value: "client", label: "👤 Client" },
  ];

  useEffect(() => {
    loadInvitations();
  }, [id]);

  const loadInvitations = async () => {
    try {
      const { data } = await apiClient.get(
        API_ENDPOINTS.INVITATIONS(Number(id)),
      );
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erreur chargement invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      Alert.alert("Champ requis", "Veuillez entrer un email.");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Email invalide", "Veuillez entrer un email valide.");
      return;
    }
    setIsSending(true);
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.INVITE, {
        email: email.trim(),
        projectId: Number(id),
        role,
      });
      setInvitations((prev) => [...prev, data]);
      setEmail("");
      Alert.alert("Succes", `Invitation envoyee a ${email} !`);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible d'envoyer l'invitation.");
    } finally {
      setIsSending(false);
    }
  };

  // Retourne la couleur selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return Colors.success;
      case "declined":
        return Colors.danger;
      default:
        return Colors.warning;
    }
  };

  // Retourne le label du statut en francais
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "✅ Acceptee";
      case "declined":
        return "❌ Refusee";
      default:
        return "⏳ En attente";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Retour
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Equipe</Text>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {invitations.length} membre{invitations.length > 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section formulaire d'invitation */}
        <View
          key="invite-form"
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Inviter un membre
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Email
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
              placeholder="email@exemple.com"
              placeholderTextColor={theme.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Role
            </Text>
            <View style={styles.rolesRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleOption,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundSecondary,
                    },
                    role === r.value && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleText,
                      { color: theme.textSecondary },
                      role === r.value && styles.roleTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.inviteButton,
              { backgroundColor: theme.primary },
              isSending && styles.inviteButtonDisabled,
            ]}
            onPress={handleInvite}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.inviteButtonText}>
                ✉️ Envoyer l'invitation
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section liste des invitations */}
        <View
          key="invite-list"
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Invitations ({invitations.length})
          </Text>

          {invitations.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                Aucune invitation envoyee
              </Text>
            </View>
          ) : (
            invitations.map((invitation) => (
              <View
                key={invitation.id}
                style={[
                  styles.invitationCard,
                  { borderBottomColor: theme.border },
                ]}
              >
                <View style={styles.invitationInfo}>
                  <Text
                    style={[
                      styles.invitationEmail,
                      { color: theme.textPrimary },
                    ]}
                  >
                    {invitation.email}
                  </Text>
                  <Text
                    style={[
                      styles.invitationRole,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Role : {invitation.role}
                  </Text>
                  <Text
                    style={[
                      styles.invitationDate,
                      { color: theme.textTertiary },
                    ]}
                  >
                    Envoye le{" "}
                    {new Date(invitation.createdAt).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(invitation.status) + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(invitation.status) },
                    ]}
                  >
                    {getStatusLabel(invitation.status)}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 18, fontWeight: "600", flex: 1 },
  count: { fontSize: 13 },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 16, padding: 16, gap: 14, borderWidth: 0.5 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  rolesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: { fontSize: 13 },
  roleTextActive: { color: "#FFFFFF", fontWeight: "500" },
  inviteButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteButtonDisabled: { opacity: 0.5 },
  inviteButtonText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  invitationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  invitationInfo: { flex: 1, gap: 2 },
  invitationEmail: { fontSize: 14, fontWeight: "500" },
  invitationRole: { fontSize: 12 },
  invitationDate: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "500" },
  empty: { alignItems: "center", gap: 8, padding: 20 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14 },
});
