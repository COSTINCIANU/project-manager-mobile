// =====================================================
// KanbanScreen — Vue Kanban d'un projet
// Affiche les taches organisees en 3 colonnes :
// A faire / En cours / Terminees
// Boutons pour deplacer les taches entre colonnes
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
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
  normale: Colors.info,
  normal: Colors.info,
};

// =====================================================
// KanbanCard — Carte tache avec boutons de deplacement
// =====================================================
function KanbanCard({
  task,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
}: {
  task: Task;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();
  const priorityColor = PRIORITY_COLORS[task.priority] ?? theme.textTertiary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
    >
      {/* Barre de priorite en haut */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
      <View style={styles.cardContent}>
        <Text
          style={[styles.cardTitle, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
        {task.dueDate && (
          <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}
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
        {/* Boutons de deplacement */}
        <View style={styles.moveButtons}>
          <TouchableOpacity
            onPress={onMoveLeft}
            disabled={!canMoveLeft}
            style={[
              styles.moveButton,
              { backgroundColor: theme.primary + "15" },
              !canMoveLeft && styles.moveButtonDisabled,
            ]}
          >
            <Text style={[styles.moveButtonText, { color: theme.primary }]}>
              ←
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveRight}
            disabled={!canMoveRight}
            style={[
              styles.moveButton,
              { backgroundColor: theme.primary + "15" },
              !canMoveRight && styles.moveButtonDisabled,
            ]}
          >
            <Text style={[styles.moveButtonText, { color: theme.primary }]}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =====================================================
// KanbanColumn — Colonne avec ses taches
// =====================================================
function KanbanColumn({
  label,
  color,
  darkColor,
  tasks,
  onMoveLeft,
  onMoveRight,
  columnIndex,
}: {
  label: string;
  color: string;
  darkColor: string;
  tasks: Task[];
  onMoveLeft: (task: Task) => void;
  onMoveRight: (task: Task) => void;
  columnIndex: number;
}) {
  // Hook theme pour les couleurs adaptees
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[styles.column, { backgroundColor: isDark ? darkColor : color }]}
    >
      <View style={styles.columnHeader}>
        <Text style={[styles.columnLabel, { color: theme.textPrimary }]}>
          {label}
        </Text>
        <View
          style={[
            styles.columnCount,
            { backgroundColor: theme.backgroundPrimary },
          ]}
        >
          <Text
            style={[styles.columnCountText, { color: theme.textSecondary }]}
          >
            {tasks.length}
          </Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyColumn}>
            <Text
              style={[styles.emptyColumnText, { color: theme.textTertiary }]}
            >
              Aucune tache
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              canMoveLeft={columnIndex > 0}
              canMoveRight={columnIndex < 2}
              onMoveLeft={() => onMoveLeft(task)}
              onMoveRight={() => onMoveRight(task)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================
// KanbanScreen — Ecran principal
// =====================================================
export default function KanbanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  const { data: tasks, isLoading } = useTasks(Number(id));

  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  // Deplace une tache vers la gauche
  const handleMoveLeft = async (task: Task) => {
    try {
      let payload = {};
      if (task.inProgress) payload = { done: false, inProgress: false };
      else if (task.done) payload = { done: false, inProgress: true };
      await updateTask.mutateAsync({ id: task.id, payload: payload as any });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de deplacer la tache.");
    }
  };

  // Deplace une tache vers la droite
  const handleMoveRight = async (task: Task) => {
    try {
      let payload = {};
      if (!task.inProgress && !task.done)
        payload = { done: false, inProgress: true };
      else if (task.inProgress) payload = { done: true, inProgress: false };
      await updateTask.mutateAsync({ id: task.id, payload: payload as any });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de deplacer la tache.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            ← Retour
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Kanban</Text>
        <Text style={[styles.count, { color: theme.textSecondary }]}>
          {tasks?.length ?? 0} taches
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.board}
          style={{ flex: 1 }}
        >
          <KanbanColumn
            label="⏳ A faire"
            color="#F1F5F9"
            darkColor="#1E293B"
            tasks={todoTasks}
            columnIndex={0}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
          />
          <KanbanColumn
            label="🔄 En cours"
            color="#EFF6FF"
            darkColor="#1E3A5F"
            tasks={inProgressTasks}
            columnIndex={1}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
          />
          <KanbanColumn
            label="✅ Terminees"
            color="#F0FDF4"
            darkColor="#14532D"
            tasks={doneTasks}
            columnIndex={2}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
          />
        </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 18, fontWeight: "600", flex: 1 },
  count: { fontSize: 13 },
  board: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  column: { width: 280, borderRadius: 12, padding: 12, height: 600 },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  columnLabel: { fontSize: 14, fontWeight: "600" },
  columnCount: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  columnCountText: { fontSize: 12, fontWeight: "600" },
  columnContent: { gap: 8, paddingBottom: 8 },
  card: { borderRadius: 10, overflow: "hidden", borderWidth: 0.5 },
  priorityBar: { height: 3 },
  cardContent: { padding: 12, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  cardDate: { fontSize: 11 },
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  priorityText: { fontSize: 11, fontWeight: "600" },
  moveButtons: { flexDirection: "row", gap: 8, marginTop: 4 },
  moveButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  moveButtonDisabled: { opacity: 0.2 },
  moveButtonText: { fontSize: 16, fontWeight: "600" },
  emptyColumn: { padding: 20, alignItems: "center" },
  emptyColumnText: { fontSize: 13 },
});
