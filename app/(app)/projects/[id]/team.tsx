// =====================================================
// TeamScreen — Gestion de l'equipe du projet
// Affiche les membres invites et permet d'en inviter
// de nouveaux en entrant leur email
// Routes utilisees :
// - GET /api/invitations/project/{id} — liste invitations
// - POST /api/invitations — inviter un membre
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
import { Colors } from "@/constants/colors";

// Type pour une invitation
interface Invitation {
  id: number;
  email: string; // Email de la personne invitee
  role: string; // Role attribue dans le projet
  status: string; // Statut : pending, accepted, declined
  createdAt: string; // Date d'envoi de l'invitation
}

export default function TeamScreen() {
  // Recupere l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Etats de la liste des invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Etats du formulaire d'invitation
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("dev");
  const [isSending, setIsSending] = useState(false);

  // Roles disponibles dans le projet
  const ROLES = [
    { value: "dev", label: "👨‍💻 Developpeur" },
    { value: "manager", label: "📋 Manager" },
    { value: "client", label: "👤 Client" },
  ];

  // Charge les invitations du projet au demarrage
  useEffect(() => {
    loadInvitations();
  }, [id]);

  // Recupere la liste des invitations depuis l'API
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

  // Envoie une invitation par email
  const handleInvite = async () => {
    // Validation de l'email
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
      // Envoie l'invitation au backend Symfony
      const { data } = await apiClient.post(API_ENDPOINTS.INVITE, {
        email: email.trim(),
        projectId: Number(id),
        role,
      });

      // Ajoute l'invitation a la liste locale
      setInvitations((prev) => [...prev, data]);
      setEmail("");
      Alert.alert("Succes", `Invitation envoyee a ${email} !`);
    } catch (error: any) {
      console.log("Erreur invitation:", error?.response?.data);
      Alert.alert("Erreur", "Impossible d'envoyer l'invitation.");
    } finally {
      setIsSending(false);
    }
  };

  // Retourne la couleur selon le statut de l'invitation
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return Colors.success;
      case "declined":
        return Colors.danger;
      default:
        return Colors.warning; // pending
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Equipe</Text>
        {/* Compteur de membres invites */}
        <Text style={styles.count}>
          {invitations.length} membre{invitations.length > 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section invitation — formulaire pour inviter un membre */}
        <View key="invite-form" style={styles.section}>
          <Text style={styles.sectionTitle}>Inviter un membre</Text>

          {/* Champ email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@exemple.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={100}
            />
          </View>

          {/* Selecteur de role */}
          <View style={styles.field}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.rolesRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleOption,
                    role === r.value && styles.roleOptionActive,
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === r.value && styles.roleTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bouton envoyer l'invitation */}
          <TouchableOpacity
            style={[
              styles.inviteButton,
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
        <View key="invite-list" style={styles.section}>
          <Text style={styles.sectionTitle}>
            Invitations ({invitations.length})
          </Text>

          {/* Message si aucune invitation */}
          {invitations.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Aucune invitation envoyee</Text>
            </View>
          ) : (
            // Liste des invitations
            invitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                {/* Email de la personne invitee */}
                <View style={styles.invitationInfo}>
                  <Text style={styles.invitationEmail}>{invitation.email}</Text>
                  <Text style={styles.invitationRole}>
                    Role : {invitation.role}
                  </Text>
                  <Text style={styles.invitationDate}>
                    Envoye le{" "}
                    {new Date(invitation.createdAt).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                {/* Badge statut */}
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
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // En-tete
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: Colors.backgroundPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15, color: Colors.primary },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  count: { fontSize: 13, color: Colors.textSecondary },

  // Contenu
  content: { padding: 16, gap: 16 },

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

  // Champs formulaire
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
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

  // Selecteur de role
  rolesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  roleOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleText: { fontSize: 13, color: Colors.textSecondary },
  roleTextActive: { color: "#FFFFFF", fontWeight: "500" },

  // Bouton invitation
  inviteButton: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteButtonDisabled: { opacity: 0.5 },
  inviteButtonText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },

  // Carte invitation
  invitationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  invitationInfo: { flex: 1, gap: 2 },
  invitationEmail: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  invitationRole: { fontSize: 12, color: Colors.textSecondary },
  invitationDate: { fontSize: 11, color: Colors.textTertiary },

  // Badge statut
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "500" },

  // Etat vide
  empty: { alignItems: "center", gap: 8, padding: 20 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 14, color: Colors.textTertiary },
});
