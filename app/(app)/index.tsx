// =====================================================
// DashboardScreen — Écran d'accueil
// Affiche une salutation, les infos utilisateur
// et les stats rapides des projets et tâches
// =====================================================

import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";
import { getUserInitials } from "@/types/user";

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();

  const totalProjects = projects?.length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter((t) => t.done).length ?? 0;
  const inProgressTasks =
    tasks?.filter((t) => t.inProgress && !t.done).length ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section salutation centrée */}
        <View style={styles.heroSection}>
          {/* Avatar avec initiales */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user ? getUserInitials(user) : "?"}
            </Text>
          </View>

          {/* Bonjour */}
          <Text style={styles.greeting}>Bonjour 👋</Text>

          {/* Nom complet */}
          <Text style={styles.userName}>{user?.name ?? "—"}</Text>

          {/* Email en petit */}
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Date du jour */}
          <Text style={styles.date}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* Stats rapides */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalProjects}</Text>
            <Text style={styles.statLabel}>Projets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Tâches</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { borderTopColor: Colors.warning, borderTopWidth: 3 },
            ]}
          >
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {inProgressTasks}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { borderTopColor: Colors.success, borderTopWidth: 3 },
            ]}
          >
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {doneTasks}
            </Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  content: { padding: 20, gap: 20 },

  // Section héro centrée
  heroSection: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },

  // Avatar rond avec initiales
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },

  // Textes salutation
  greeting: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary },
  userName: { fontSize: 18, fontWeight: "600", color: Colors.primary },
  userEmail: { fontSize: 13, color: Colors.textTertiary },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 4,
  },

  // Titre section
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Grille de stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
    gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: "700", color: Colors.primary },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
});
