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
import { Colors } from "@/constants/colors";
import { Project } from "@/types/project";

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
  archived: "Archivé",
  completed: "Terminé",
};

function ProjectCard({
  project,
  onPress,
}: {
  project: Project;
  onPress: () => void;
}) {
  const progress = project.progress ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
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
        <Text style={styles.cardDesc} numberOfLines={2}>
          {project.description}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          {project.completedTasksCount ?? 0}/{project.tasksCount ?? 0} tâches
        </Text>
        <Text style={styles.statusText}>{STATUS_LABELS[project.status]}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const {
    data: projects,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useProjects();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Erreur de chargement</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projets</Text>
        <Text style={styles.count}>
          {projects?.length ?? 0} projet{(projects?.length ?? 0) > 1 ? "s" : ""}
        </Text>
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
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun projet pour le moment</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },
  count: { fontSize: 14, color: Colors.textSecondary },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  priorityText: { fontSize: 11, fontWeight: "600" },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 12, color: Colors.textSecondary },
  statusText: { fontSize: 12, color: Colors.textTertiary },
  errorText: { fontSize: 15, color: Colors.danger, marginBottom: 12 },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 15, color: Colors.textTertiary },
});
