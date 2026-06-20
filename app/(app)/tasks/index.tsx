// =====================================================
// TasksScreen — Mes taches
// Affiche toutes les taches de tous les projets
// avec filtres par statut
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
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
import { Task } from "@/types/task";

// Filtres disponibles
const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "todo", label: "A faire" },
  { id: "inProgress", label: "En cours" },
  { id: "done", label: "Terminees" },
];

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
// CARTE TACHE
// =====================
function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const priorityColor = PRIORITY_COLORS[task.priority] ?? theme.textTertiary;

  return (
    <TouchableOpacity
      style={[
        styles.taskCard,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
      onPress={() => router.push(`/(app)/tasks/${task.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.taskHeader}>
        <View
          style={[
            styles.statusDot,
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
          style={[
            styles.taskName,
            { color: theme.textPrimary },
            task.done && {
              textDecorationLine: "line-through",
              color: theme.textTertiary,
            },
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
      </View>
      <View style={styles.taskFooter}>
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
          <Text style={[styles.dueDate, { color: theme.textSecondary }]}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>
          {task.done
            ? "✅ Termine"
            : task.inProgress
              ? "🔄 En cours"
              : "⏳ A faire"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// =====================
// ECRAN PRINCIPAL
// =====================
export default function TasksScreen() {
  const [activeFilter, setActiveFilter] = useState("all");
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const { data: tasks, isLoading, refetch, isFetching } = useTasks();

  const filteredTasks =
    tasks?.filter((task) => {
      if (activeFilter === "todo") return !task.done && !task.inProgress;
      if (activeFilter === "inProgress") return task.inProgress && !task.done;
      if (activeFilter === "done") return task.done;
      return true;
    }) ?? [];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Mes taches
        </Text>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {filteredTasks.length}
        </Text>
      </View>

      {/* Barre de filtres */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
              activeFilter === filter.id && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                { color: theme.textSecondary },
                activeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Indicateur de chargement */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TaskCard task={item} />}
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
                Aucune tache
              </Text>
            </View>
          }
        />
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700" },
  count: { fontSize: 14 },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  filterText: { fontSize: 13 },
  filterTextActive: { color: "#FFFFFF", fontWeight: "500" },
  list: { padding: 16, gap: 10 },
  taskCard: { borderRadius: 12, padding: 14, gap: 10, borderWidth: 0.5 },
  taskHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  taskName: { fontSize: 14, fontWeight: "500", flex: 1 },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: "600" },
  dueDate: { fontSize: 11 },
  statusText: { fontSize: 11, marginLeft: "auto" },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 15 },
});
