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
import { Colors } from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // queryClient permet d'invalider le cache apres suppression
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useProject(Number(id));
  const { data: tasks } = useTasks(Number(id));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) return null;

  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete avec bouton retour et bouton modifier */}
      <View style={styles.header}>
        {/* Bouton retour vers la liste des projets */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        {/* Nom du projet */}
        <Text style={styles.title} numberOfLines={1}>
          {project.name}
        </Text>

        {/* Bouton pour modifier le projet */}
        <TouchableOpacity
          onPress={() =>
            router.push(`/(app)/projects/${id}/edit-project` as any)
          }
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>

        {/* Bouton supprimer le projet */}
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
                      // Invalide le cache pour mettre a jour la liste des projets
                      queryClient.invalidateQueries({ queryKey: ["projects"] });
                      // Retourne a la liste des projets apres suppression
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
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {project.description && (
          <Text style={styles.description}>{project.description}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todoTasks.length}</Text>
            <Text style={styles.statLabel}>À faire</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {inProgressTasks.length}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {doneTasks.length}
            </Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${project.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{project.progress}%</Text>
        </View>

        {/* ACTIONS  */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(app)/projects/${id}/tasks` as any)}
          >
            {/* Bouton Taches */}
            <Text style={styles.actionText}>📋 Tâches</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(app)/projects/${id}/kanban` as any)}
          >
            {/* Bouton Kanban */}
            <Text style={styles.actionText}>🗂 Kanban</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(app)/projects/${id}/ai` as any)}
          >
            {/* Bouton vers le IA */}
            <Text style={styles.actionText}>✨ IA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(app)/projects/${id}/wiki` as any)}
          >
            {/* Bouton vers le wiki du projet */}
            <Text style={styles.actionText}>📚 Wiki</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(app)/projects/${id}/chat` as any)}
          >
            {/* Bouton vers le chat du projet */}
            <Text style={styles.actionText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>

        {tasks && tasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tâches récentes</Text>
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
                          : Colors.textTertiary,
                    },
                  ]}
                />
                <Text style={styles.taskTitle} numberOfLines={1}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  content: { padding: 16, gap: 16 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 24, fontWeight: "700", color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 3,
  },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { fontSize: 13, color: Colors.textSecondary, minWidth: 36 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  actionText: { fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  section: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  taskItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 14, color: Colors.textSecondary, flex: 1 },

  // Bouton modifier le projet
  editButton: {
    padding: 8,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  // Icone du bouton modifier
  editButtonText: { fontSize: 16 },

  // Bouton supprimer le projet
  deleteButton: {
    padding: 8,
    backgroundColor: Colors.danger + "15",
    borderRadius: 20,
  },
  // Icone du bouton supprimer
  deleteButtonText: { fontSize: 16 },
});
