// =====================================================
// ProjectDetailScreen — Detail d'un projet
// Affiche les stats, actions et taches recentes
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";

// Liste des actions du projet
const ACTIONS = [
  { icon: "📋", label: "Taches", path: "tasks" },
  { icon: "🗂", label: "Kanban", path: "kanban" },
  { icon: "✨", label: "IA", path: "ai" },
  { icon: "📚", label: "Wiki", path: "wiki" },
  { icon: "💬", label: "Chat", path: "chat" },
  { icon: "👥", label: "Equipe", path: "team" },
  { icon: "⚙️", label: "Champs", path: "custom-fields" },
  { icon: "📦", label: "Backlog", path: "backlog" },
  { icon: "📊", label: "Rapports", path: "burndown" },
  { icon: "📈", label: "Rapports", path: "rapports" },
  { icon: "🔁", label: "Automatisations", path: "automatisations" },
];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { isTablet } = useBreakpoint();

  const { data: project, isLoading } = useProject(Number(id));
  const { data: tasks } = useTasks(Number(id));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) return null;

  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  // Colonne gauche — stats, progression, actions
  const LeftContent = ({ isTablet }: { isTablet: boolean }) => (
    <>
      {project.description && (
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {project.description}
        </Text>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.primary }]}>{todoTasks.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>A faire</Text>
        </View>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.warning }]}>
            {inProgressTasks.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>En cours</Text>
        </View>
        <View
          style={[
            styles.statBox,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.success }]}>{doneTasks.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Terminees</Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${project.progress}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {project.progress}%
        </Text>
      </View>

      {/* Actions — grille sur tablette, scroll horizontal sur mobile */}
      {isTablet ? (
        <View style={styles.actionsGrid}>
          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.path}
              style={[
                styles.actionButton,
                styles.actionButtonTablet,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push(`/(app)/projects/${id}/${action.path}` as any)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.path}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => router.push(`/(app)/projects/${id}/${action.path}` as any)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionText, { color: theme.textPrimary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </>
  );

  // Colonne droite — taches recentes
  const RightContent = () => (
    <>
      {tasks && tasks.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.backgroundPrimary }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Taches recentes</Text>
          {tasks.slice(0, 5).map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View
                style={[
                  styles.taskDot,
                  {
                    backgroundColor: task.done
                      ? Colors.success
                      : task.inProgress
                        ? Colors.warning
                        : theme.textTertiary,
                  },
                ]}
              />
              <Text style={[styles.taskTitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {task.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {project.name}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/projects/${id}/edit-project` as any)}
          style={[styles.editButton, { backgroundColor: theme.primary + "15" }]}
        >
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce projet ?", [
              { text: "Annuler", style: "cancel" },
              {
                text: "Supprimer",
                style: "destructive",
                onPress: async () => {
                  try {
                    await apiClient.delete(API_ENDPOINTS.PROJECT(Number(id)));
                    queryClient.invalidateQueries({ queryKey: ["projects"] });
                    router.replace("/(app)/projects" as any);
                  } catch (error) {
                    Alert.alert("Erreur", "Impossible de supprimer le projet.");
                  }
                },
              },
            ]);
          }}
          style={[styles.deleteButton, { backgroundColor: Colors.danger + "15" }]}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        showsVerticalScrollIndicator={false}
      >
        {isTablet ? (
          // Layout tablette — 2 colonnes
          <>
            <View style={styles.tabletLeft}>
              <LeftContent isTablet={true} />
            </View>
            <View style={styles.tabletRight}>
              <RightContent />
            </View>
          </>
        ) : (
          // Layout mobile — 1 colonne
          <>
            <LeftContent isTablet={false} />
            <RightContent />
          </>
        )}
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
  content: { padding: 16, gap: 16 },
  contentTablet: {
    padding: 24,
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  tabletLeft: { flex: 1, gap: 16 },
  tabletRight: { flex: 1, gap: 16 },
  description: { fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
  },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 13, minWidth: 36 },
  // Actions scroll mobile
  actionsRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  // Actions grille tablette
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionButton: {
    width: 80,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
  },
  // Bouton action sur tablette — prend 30% de la largeur
  actionButtonTablet: { width: "30%" },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  section: { borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  taskItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 14, flex: 1 },
  editButton: { padding: 8, borderRadius: 20 },
  editButtonText: { fontSize: 16 },
  deleteButton: { padding: 8, borderRadius: 20 },
  deleteButtonText: { fontSize: 16 },
});
