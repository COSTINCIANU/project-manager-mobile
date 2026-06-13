// =====================================================
// DashboardScreen — Écran d'accueil
// Affiche salutation, stats, projets récents
// et tâches urgentes de l'utilisateur connecté
// =====================================================

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";
import { getUserInitials } from "@/types/user";
import { Project } from "@/types/project";
import { Task } from "@/types/task";

// =====================
// COULEURS PAR PRIORITÉ
// =====================
const PRIORITY_COLORS: Record<string, string> = {
  haute: Colors.priorityHigh,
  high: Colors.priorityHigh,
  moyenne: Colors.priorityMedium,
  medium: Colors.priorityMedium,
  faible: Colors.priorityLow,
  low: Colors.priorityLow,
  critique: Colors.priorityCritical,
  critical: Colors.priorityCritical,
};

// =====================
// CARTE PROJET RÉCENT
// Cliquable — redirige vers le détail du projet
// =====================
function RecentProjectCard({
  project,
  onPress,
}: {
  project: Project;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Nom du projet */}
      <Text style={styles.projectName} numberOfLines={1}>
        {project.name}
      </Text>

      {/* Barre de progression */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${project.progress ?? 0}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{project.progress ?? 0}%</Text>
      </View>

      {/* Compteur de tâches */}
      <Text style={styles.projectTasks}>
        {project.completedTasksCount ?? 0}/{project.tasksCount ?? 0} tâches
      </Text>
    </TouchableOpacity>
  );
}

// =====================
// CARTE TÂCHE URGENTE
// Tâches en cours ou à faire avec date proche
// =====================
function UrgentTaskCard({ task }: { task: Task }) {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.textTertiary;

  return (
    <View style={styles.urgentCard}>
      {/* Barre de priorité à gauche */}
      <View style={[styles.urgentBar, { backgroundColor: priorityColor }]} />

      <View style={styles.urgentContent}>
        {/* Nom de la tâche */}
        <Text style={styles.urgentName} numberOfLines={1}>
          {task.name}
        </Text>

        <View style={styles.urgentFooter}>
          {/* Badge priorité */}
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityColor + "20" },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {task.priority}
            </Text>
          </View>

          {/* Date d'échéance */}
          {task.dueDate && (
            <Text style={styles.urgentDate}>
              📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
            </Text>
          )}

          {/* Statut */}
          <Text style={styles.urgentStatus}>
            {task.inProgress ? "🔄 En cours" : "⏳ À faire"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================
// ÉCRAN PRINCIPAL
// =====================
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();

  // Stats globales
  const totalProjects = projects?.length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter((t) => t.done).length ?? 0;
  const inProgressTasks =
    tasks?.filter((t) => t.inProgress && !t.done).length ?? 0;

  // Progression globale en pourcentage
  const globalProgress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // 3 projets les plus récents
  const recentProjects = projects?.slice(0, 3) ?? [];

  // Tâches urgentes — non terminées, triées par date d'échéance
  const urgentTasks =
    tasks
      ?.filter((t) => !t.done)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section héro — salutation centrée */}
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user ? getUserInitials(user) : "?"}
            </Text>
          </View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.userName}>{user?.name ?? "—"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* Stats rapides en grille 2x2 */}
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

        {/* Progression globale */}
        <View style={styles.globalProgress}>
          <View style={styles.globalProgressHeader}>
            <Text style={styles.globalProgressLabel}>Progression globale</Text>
            <Text style={styles.globalProgressValue}>{globalProgress}%</Text>
          </View>
          <View style={styles.globalProgressBar}>
            <View
              style={[
                styles.globalProgressFill,
                { width: `${globalProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.globalProgressSub}>
            {doneTasks} tâche{doneTasks > 1 ? "s" : ""} terminée
            {doneTasks > 1 ? "s" : ""} sur {totalTasks}
          </Text>
        </View>

        {/* Projets récents */}
        {recentProjects.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projets récents</Text>
              <TouchableOpacity
                onPress={() => router.push("/(app)/projects" as any)}
              >
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.projectsList}>
              {recentProjects.map((project) => (
                <RecentProjectCard
                  key={project.id}
                  project={project}
                  onPress={() =>
                    router.push(`/(app)/projects/${project.id}` as any)
                  }
                />
              ))}
            </View>
          </View>
        )}

        {/* Tâches urgentes */}
        {urgentTasks.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tâches urgentes</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/tasks")}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.urgentList}>
              {urgentTasks.map((task) => (
                <UrgentTaskCard key={task.id} task={task} />
              ))}
            </View>
          </View>
        )}
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

  // Hero section
  heroSection: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
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
  greeting: { fontSize: 22, fontWeight: "700", color: Colors.textPrimary },
  userName: { fontSize: 18, fontWeight: "600", color: Colors.primary },
  userEmail: { fontSize: 13, color: Colors.textTertiary },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "capitalize",
    marginTop: 4,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: "500" },

  // Stats
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

  // Progression globale
  globalProgress: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  globalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  globalProgressLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  globalProgressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  globalProgressBar: {
    height: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
  },
  globalProgressFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  globalProgressSub: { fontSize: 12, color: Colors.textSecondary },

  // Projets récents
  projectsList: { gap: 10 },
  projectCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  projectName: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 2,
  },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 32,
    textAlign: "right",
  },
  projectTasks: { fontSize: 12, color: Colors.textTertiary },

  // Tâches urgentes
  urgentList: { gap: 8 },
  urgentCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  urgentBar: { width: 4 },
  urgentContent: { flex: 1, padding: 12, gap: 6 },
  urgentName: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  urgentFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: "600" },
  urgentDate: { fontSize: 11, color: Colors.textSecondary },
  urgentStatus: { fontSize: 11, color: Colors.textSecondary },
});
