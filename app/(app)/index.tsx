// =====================================================
// DashboardScreen — Ecran d'accueil
// Affiche salutation, stats, projets recents
// et taches urgentes de l'utilisateur connecte
// Theme clair/sombre automatique selon le systeme
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
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
import { getUserInitials } from "@/types/user";
import { Project } from "@/types/project";
import { Task } from "@/types/task";

// Couleurs par priorite — fixes independamment du theme
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
// CARTE PROJET RECENT
// =====================
function RecentProjectCard({
  project,
  onPress,
}: {
  project: Project;
  onPress: () => void;
}) {
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.projectCard,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.projectName, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {project.name}
      </Text>
      <View style={styles.progressRow}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.backgroundTertiary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${project.progress ?? 0}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {project.progress ?? 0}%
        </Text>
      </View>
      <Text style={[styles.projectTasks, { color: theme.textTertiary }]}>
        {project.completedTasksCount ?? 0}/{project.tasksCount ?? 0} taches
      </Text>
    </TouchableOpacity>
  );
}

// =====================
// CARTE TACHE URGENTE
// =====================
function UrgentTaskCard({ task }: { task: Task }) {
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const priorityColor = PRIORITY_COLORS[task.priority] ?? theme.textTertiary;

  return (
    <View
      style={[
        styles.urgentCard,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
    >
      <View style={[styles.urgentBar, { backgroundColor: priorityColor }]} />
      <View style={styles.urgentContent}>
        <Text
          style={[styles.urgentName, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
        <View style={styles.urgentFooter}>
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
          {task.dueDate && (
            <Text style={[styles.urgentDate, { color: theme.textSecondary }]}>
              📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
            </Text>
          )}
          <Text style={[styles.urgentStatus, { color: theme.textSecondary }]}>
            {task.inProgress ? "🔄 En cours" : "⏳ A faire"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================
// ECRAN PRINCIPAL
// =====================
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  // Stats globales
  const totalProjects = projects?.length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter((t) => t.done).length ?? 0;
  const inProgressTasks =
    tasks?.filter((t) => t.inProgress && !t.done).length ?? 0;
  const globalProgress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // 3 projets les plus recents
  const recentProjects = projects?.slice(0, 3) ?? [];

  // Taches urgentes — non terminees, triees par date d'echeance
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section hero — salutation centree */}
        <View
          style={[
            styles.heroSection,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user ? getUserInitials(user) : "?"}
            </Text>
          </View>
          <Text style={[styles.greeting, { color: theme.textPrimary }]}>
            Bonjour 👋
          </Text>
          <Text style={[styles.userName, { color: theme.primary }]}>
            {user?.name ?? "—"}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textTertiary }]}>
            {user?.email}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* Stats rapides en grille 2x2 */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Vue d'ensemble
        </Text>
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {totalProjects}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Projets
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {totalTasks}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Taches
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
                borderTopColor: Colors.warning,
                borderTopWidth: 3,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {inProgressTasks}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              En cours
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
                borderTopColor: Colors.success,
                borderTopWidth: 3,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {doneTasks}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Terminees
            </Text>
          </View>
        </View>

        {/* Progression globale */}
        <View
          style={[
            styles.globalProgress,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.globalProgressHeader}>
            <Text
              style={[styles.globalProgressLabel, { color: theme.textPrimary }]}
            >
              Progression globale
            </Text>
            <Text
              style={[styles.globalProgressValue, { color: theme.primary }]}
            >
              {globalProgress}%
            </Text>
          </View>
          <View
            style={[
              styles.globalProgressBar,
              { backgroundColor: theme.backgroundTertiary },
            ]}
          >
            <View
              style={[
                styles.globalProgressFill,
                { width: `${globalProgress}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>
          <Text
            style={[styles.globalProgressSub, { color: theme.textSecondary }]}
          >
            {doneTasks} tache{doneTasks > 1 ? "s" : ""} terminee
            {doneTasks > 1 ? "s" : ""} sur {totalTasks}
          </Text>
        </View>

        {/* Projets recents */}
        {recentProjects.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Projets recents
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(app)/projects" as any)}
              >
                <Text style={[styles.seeAll, { color: theme.primary }]}>
                  Voir tout
                </Text>
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

        {/* Taches urgentes */}
        {urgentTasks.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Taches urgentes
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(app)/tasks" as any)}
              >
                <Text style={[styles.seeAll, { color: theme.primary }]}>
                  Voir tout
                </Text>
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
// STYLES — valeurs fixes uniquement
// Les couleurs sont appliquees dynamiquement via theme
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 20 },

  // Hero section
  heroSection: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 26, fontWeight: "700", color: "#FFFFFF" },
  greeting: { fontSize: 22, fontWeight: "700" },
  userName: { fontSize: 18, fontWeight: "600" },
  userEmail: { fontSize: 13 },
  date: { fontSize: 13, textTransform: "capitalize", marginTop: 4 },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },
  seeAll: { fontSize: 13, fontWeight: "500" },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: "700" },
  statLabel: { fontSize: 13 },

  // Progression globale
  globalProgress: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 0.5,
  },
  globalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  globalProgressLabel: { fontSize: 14, fontWeight: "500" },
  globalProgressValue: { fontSize: 14, fontWeight: "700" },
  globalProgressBar: { height: 8, borderRadius: 4 },
  globalProgressFill: { height: 8, borderRadius: 4 },
  globalProgressSub: { fontSize: 12 },

  // Projets recents
  projectsList: { gap: 10 },
  projectCard: { borderRadius: 12, padding: 14, gap: 8, borderWidth: 0.5 },
  projectName: { fontSize: 15, fontWeight: "600" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 12, minWidth: 32, textAlign: "right" },
  projectTasks: { fontSize: 12 },

  // Taches urgentes
  urgentList: { gap: 8 },
  urgentCard: {
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 0.5,
  },
  urgentBar: { width: 4 },
  urgentContent: { flex: 1, padding: 12, gap: 6 },
  urgentName: { fontSize: 14, fontWeight: "500" },
  urgentFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: "600" },
  urgentDate: { fontSize: 11 },
  urgentStatus: { fontSize: 11 },
});
