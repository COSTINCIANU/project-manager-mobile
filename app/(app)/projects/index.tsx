// =====================================================
// ProjectsScreen — Liste des projets
// Affiche tous les projets avec progression
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useProjects } from "@/hooks/useProjects";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
import { Project } from "@/types/project";

// Couleurs et labels par priorite — fixes independamment du theme
const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.priorityLow,
  medium: Colors.priorityMedium,
  high: Colors.priorityHigh,
  critical: Colors.priorityCritical,
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  critical: "Critique",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  archived: "Archive",
  completed: "Termine",
};

// =====================
// CARTE PROJET
// =====================
function ProjectCard({
  project,
  onPress,
}: {
  project: Project;
  onPress: () => void;
}) {
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const progress = project.progress ?? 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.cardTitle, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {project.name}
        </Text>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: PRIORITY_COLORS[project.priority] + "20" },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              { color: PRIORITY_COLORS[project.priority] },
            ]}
          >
            {PRIORITY_LABELS[project.priority]}
          </Text>
        </View>
      </View>

      {project.description && (
        <Text
          style={[styles.cardDesc, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {project.description}
        </Text>
      )}

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
              { width: `${progress}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {progress}%
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          {project.completedTasksCount ?? 0}/{project.tasksCount ?? 0} taches
        </Text>
        <Text style={[styles.statusText, { color: theme.textTertiary }]}>
          {STATUS_LABELS[project.status]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const {
    data: projects,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useProjects();

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

  if (isError) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: Colors.danger }]}>
            Erreur de chargement
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete avec titre et bouton creer un nouveau projet */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Projets
        </Text>
        {/* Bouton pour naviguer vers le formulaire de creation */}
        <TouchableOpacity
          onPress={() => router.push("/(app)/projects/create" as any)}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.addButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => router.push(`/(app)/projects/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
              Aucun projet pour le moment
            </Text>
          </View>
        }
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, padding: 16, borderWidth: 0.5, gap: 10 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  priorityText: { fontSize: 11, fontWeight: "600" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 12, minWidth: 32, textAlign: "right" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 12 },
  statusText: { fontSize: 12 },
  errorText: { fontSize: 15, marginBottom: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 15 },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButtonText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
});
