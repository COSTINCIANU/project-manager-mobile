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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProject } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  // queryClient permet d'invalider le cache apres suppression
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useProject(Number(id));
  const { data: tasks } = useTasks(Number(id));

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

  if (!project) return null;

  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete avec bouton retour et boutons modifier/supprimer */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundPrimary,
            borderBottomColor: theme.border,
          },
        ]}
      >
        {/* Bouton retour */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Retour
          </Text>
        </TouchableOpacity>

        {/* Nom du projet */}
        <Text
          style={[styles.title, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {project.name}
        </Text>

        {/* Bouton modifier */}
        <TouchableOpacity
          onPress={() =>
            router.push(`/(app)/projects/${id}/edit-project` as any)
          }
          style={[styles.editButton, { backgroundColor: theme.primary + "15" }]}
        >
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>

        {/* Bouton supprimer */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Supprimer",
              "Voulez-vous vraiment supprimer ce projet ? Cette action est irreversible.",
              [
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
                      Alert.alert(
                        "Erreur",
                        "Impossible de supprimer le projet.",
                      );
                    }
                  },
                },
              ],
            );
          }}
          style={[
            styles.deleteButton,
            { backgroundColor: Colors.danger + "15" },
          ]}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Description du projet */}
        {project.description && (
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {project.description}
          </Text>
        )}

        {/* Stats — A faire, En cours, Terminees */}
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
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {todoTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              A faire
            </Text>
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
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              En cours
            </Text>
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
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {doneTasks.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Terminees
            </Text>
          </View>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
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
                  width: `${project.progress}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {project.progress}%
          </Text>
        </View>

        {/* ACTIONS — scroll horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(`/(app)/projects/${id}/tasks` as any)}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              Taches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(`/(app)/projects/${id}/kanban` as any)}
          >
            <Text style={styles.actionIcon}>🗂</Text>
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              Kanban
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(`/(app)/projects/${id}/ai` as any)}
          >
            <Text style={styles.actionIcon}>✨</Text>
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              IA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(`/(app)/projects/${id}/wiki` as any)}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              Wiki
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(`/(app)/projects/${id}/chat` as any)}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push(`/(app)/projects/${id}/team` as any)}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>
              Equipe
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Taches recentes */}
        {tasks && tasks.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: theme.backgroundPrimary },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Taches recentes
            </Text>
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
                <Text
                  style={[styles.taskTitle, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {task.name}
                </Text>
              </View>
            ))}
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
  actionsRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  actionButton: {
    width: 80,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
  },
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
