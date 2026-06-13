// =====================================================
// ProjectTasksScreen — Liste des tâches d'un projet
// Affiche toutes les tâches avec leur statut, priorité
// et date d'échéance. Pull-to-refresh pour recharger.
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTasks } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";
import { Task } from "@/types/task";

// =====================
// COULEURS PAR PRIORITÉ
// Supporte les valeurs en français (API) et en anglais
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
// Affiche une tâche individuelle avec son statut,
// son nom, sa priorité et sa date d'échéance
// =====================
function TaskItem({ task }: { task: Task }) {
  // Couleur de la priorité — gris par défaut si inconnue
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.textTertiary;

  return (
    <View style={styles.taskCard}>
      {/* En-tête : point coloré + nom de la tâche */}
      <View style={styles.taskHeader}>
        {/* Point vert = terminé, orange = en cours, gris = à faire */}
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
        {/* Nom barré si la tâche est terminée */}
        <Text
          style={[styles.taskName, task.done && styles.taskDone]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
      </View>

      {/* Pied de carte : priorité + date + statut */}
      <View style={styles.taskFooter}>
        {/* Badge de priorité coloré */}
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

        {/* Date d'échéance — affichée uniquement si définie */}
        {task.dueDate && (
          <Text style={styles.dueDate}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}

        {/* Statut textuel de la tâche */}
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
export default function ProjectTasksScreen() {
  // Récupère l'ID du projet depuis l'URL (ex: /projects/3/tasks)
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Hook React Query — charge les tâches du projet depuis l'API
  // isFetching = true pendant le pull-to-refresh
  const { data: tasks, isLoading, refetch, isFetching } = useTasks(Number(id));

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec bouton retour et compteur de tâches */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tâches</Text>
        <Text style={styles.count}>{tasks?.length ?? 0}</Text>
      </View>

      {/* Indicateur de chargement au premier chargement */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        // Liste des tâches avec pull-to-refresh
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TaskItem task={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          // Pull-to-refresh : tirer vers le bas pour recharger
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          // Message affiché si aucune tâche
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune tâche pour ce projet</Text>
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

  // En-tête de la page
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
  count: { fontSize: 14, color: Colors.textSecondary },

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

  // Pied de carte
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
