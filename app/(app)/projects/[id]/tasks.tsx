// =====================================================
// ProjectTasksScreen — Liste des taches d'un projet
// Affiche toutes les taches avec statut, priorite
// et date d'echeance. Pull-to-refresh pour recharger.
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
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTasks } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";
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

// Icones par type de ticket
const TICKET_TYPE_ICONS: Record<string, string> = {
  task: "✅",
  bug: "🐛",
  story: "📖",
  epic: "⚡",
};

// =====================================================
// TaskItem — Carte tache cliquable dans la liste
// =====================================================
function TaskItem({ task, isTablet }: { task: Task; isTablet: boolean }) {
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const priorityColor = PRIORITY_COLORS[task.priority] ?? theme.textTertiary;

  return (
    <TouchableOpacity
      style={[
        styles.taskCard,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
        // isTablet && { flex: 1 }
        isTablet && { flex: 1, maxWidth: "49%" },
      ]}
      onPress={() => router.push(`/(app)/tasks/${task.id}` as any)}
      activeOpacity={0.7}
    >
      {/* En-tete : icone type + point de statut + nom */}
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
        {/* Icone du type de ticket */}
        <Text style={styles.ticketTypeIcon}>
          {TICKET_TYPE_ICONS[task.ticketType ?? "task"] ?? "✅"}
        </Text>
        <Text
          style={[
            styles.taskName,
            { color: theme.textPrimary },
            task.done && styles.taskDone,
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
      </View>
      {/* Pied de carte : priorite + date + statut */}
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
export default function ProjectTasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const { data: tasks, isLoading, refetch, isFetching } = useTasks(Number(id));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete avec bouton retour et bouton creer */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundPrimary,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Retour
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Taches</Text>
        <TouchableOpacity
          onPress={() =>
            router.push(`/(app)/projects/${id}/create-task` as any)
          }
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.addButtonText}>+ Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Indicateur de chargement */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TaskItem task={item} isTablet={isTablet} />
          )}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? "tablet" : "mobile"}
          columnWrapperStyle={
            isTablet ? { gap: 10, paddingHorizontal: 16 } : undefined
          }
          contentContainerStyle={[styles.list, isTablet && { padding: 24 }]}
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
                Aucune tache pour ce projet
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
  list: { padding: 16, gap: 10 },
  taskCard: { borderRadius: 12, padding: 14, gap: 10, borderWidth: 0.5 },
  taskHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  taskName: { fontSize: 14, fontWeight: "500", flex: 1 },
  taskDone: { textDecorationLine: "line-through" },
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
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButtonText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },

  ticketTypeIcon: { fontSize: 13 },
});
