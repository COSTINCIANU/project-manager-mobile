// =====================================================
// TasksScreen — Mes tâches
// Affiche toutes les tâches de tous les projets
// de l'utilisateur connecté, avec filtres par statut
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
import { useTasks } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";
import { Task } from "@/types/task";

// =====================
// FILTRES DISPONIBLES
// =====================
const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "todo", label: "À faire" },
  { id: "inProgress", label: "En cours" },
  { id: "done", label: "Terminées" },
];

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
// COMPOSANT CARTE TÂCHE
// =====================
function TaskCard({ task }: { task: Task }) {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.textTertiary;

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        {/* Point coloré selon le statut */}
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: task.done
                ? Colors.success
                : task.inProgress
                  ? Colors.warning
                  : Colors.textTertiary,
            },
          ]}
        />
        {/* Nom barré si terminé */}
        <Text
          style={[styles.taskName, task.done && styles.taskDone]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
      </View>

      <View style={styles.taskFooter}>
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
          <Text style={styles.dueDate}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}

        {/* Statut */}
        <Text style={styles.statusText}>
          {task.done
            ? "✅ Terminé"
            : task.inProgress
              ? "🔄 En cours"
              : "⏳ À faire"}
        </Text>
      </View>
    </View>
  );
}

// =====================
// ÉCRAN PRINCIPAL
// =====================
export default function TasksScreen() {
  // Filtre actif — 'all' par défaut
  const [activeFilter, setActiveFilter] = useState("all");

  // Charge toutes les tâches sans filtre de projet
  const { data: tasks, isLoading, refetch, isFetching } = useTasks();

  // Filtre les tâches selon le filtre actif
  const filteredTasks =
    tasks?.filter((task) => {
      if (activeFilter === "todo") return !task.done && !task.inProgress;
      if (activeFilter === "inProgress") return task.inProgress && !task.done;
      if (activeFilter === "done") return task.done;
      return true; // 'all'
    }) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes tâches</Text>
        <Text style={styles.count}>{filteredTasks.length}</Text>
      </View>

      {/* Barre de filtres */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
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
          <ActivityIndicator size="large" color={Colors.primary} />
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
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune tâche</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // En-tête
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },
  count: { fontSize: 14, color: Colors.textSecondary },

  // Filtres
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
    backgroundColor: Colors.backgroundPrimary,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: { fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: "#FFFFFF", fontWeight: "500" },

  // Liste
  list: { padding: 16, gap: 10 },

  // Carte tâche
  taskCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  taskHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  taskName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
    flex: 1,
  },
  taskDone: { textDecorationLine: "line-through", color: Colors.textTertiary },
  taskFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  priorityText: { fontSize: 11, fontWeight: "600" },
  dueDate: { fontSize: 11, color: Colors.textSecondary },
  statusText: { fontSize: 11, color: Colors.textSecondary, marginLeft: "auto" },

  // État vide
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 15, color: Colors.textTertiary },
});
