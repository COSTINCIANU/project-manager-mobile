// =====================================================
// KanbanScreen — Vue Kanban d'un projet
// Affiche les taches organisees en 3 colonnes :
// A faire / En cours / Terminees
// Boutons pour deplacer les taches entre colonnes
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
import { Colors } from "@/constants/colors";
import { Task } from "@/types/task";

// Couleurs par priorite
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
// Permet de changer le statut de la tache
// en cliquant sur les fleches gauche/droite
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
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.textTertiary;

  return (
    <View style={styles.card}>
      {/* Barre de priorite en haut de la carte */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.cardContent}>
        {/* Nom de la tache */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {task.name}
        </Text>

        {/* Date d'echeance si definie */}
        {task.dueDate && (
          <Text style={styles.cardDate}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}

        {/* Badge de priorite */}
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

        {/* Boutons de deplacement entre colonnes */}
        <View style={styles.moveButtons}>
          {/* Bouton deplacer vers la gauche */}
          <TouchableOpacity
            onPress={onMoveLeft}
            disabled={!canMoveLeft}
            style={[
              styles.moveButton,
              !canMoveLeft && styles.moveButtonDisabled,
            ]}
          >
            <Text style={styles.moveButtonText}>←</Text>
          </TouchableOpacity>

          {/* Bouton deplacer vers la droite */}
          <TouchableOpacity
            onPress={onMoveRight}
            disabled={!canMoveRight}
            style={[
              styles.moveButton,
              !canMoveRight && styles.moveButtonDisabled,
            ]}
          >
            <Text style={styles.moveButtonText}>→</Text>
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
  tasks,
  onMoveLeft,
  onMoveRight,
  columnIndex,
}: {
  label: string;
  color: string;
  tasks: Task[];
  onMoveLeft: (task: Task) => void;
  onMoveRight: (task: Task) => void;
  columnIndex: number;
}) {
  return (
    <View style={[styles.column, { backgroundColor: color }]}>
      {/* En-tete de la colonne avec compteur */}
      <View style={styles.columnHeader}>
        <Text style={styles.columnLabel}>{label}</Text>
        <View style={styles.columnCount}>
          <Text style={styles.columnCountText}>{tasks.length}</Text>
        </View>
      </View>

      {/* Liste des cartes */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyColumn}>
            <Text style={styles.emptyColumnText}>Aucune tache</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              // Peut aller a gauche si pas dans la premiere colonne
              canMoveLeft={columnIndex > 0}
              // Peut aller a droite si pas dans la derniere colonne
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

  // Charge les taches du projet filtre par projectId
  const { data: tasks, isLoading } = useTasks(Number(id));

  // Repartit les taches dans les 3 colonnes
  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  // Deplace une tache vers la colonne de gauche
  const handleMoveLeft = async (task: Task) => {
    try {
      let payload = {};
      if (task.inProgress) {
        // En cours → A faire
        payload = { done: false, inProgress: false };
      } else if (task.done) {
        // Termine → En cours
        payload = { done: false, inProgress: true };
      }
      await updateTask.mutateAsync({ id: task.id, payload: payload as any });
      // Rafraichit la liste des taches
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de deplacer la tache.");
    }
  };

  // Deplace une tache vers la colonne de droite
  const handleMoveRight = async (task: Task) => {
    try {
      let payload = {};
      if (!task.inProgress && !task.done) {
        // A faire → En cours
        payload = { done: false, inProgress: true };
      } else if (task.inProgress) {
        // En cours → Termine
        payload = { done: true, inProgress: false };
      }
      await updateTask.mutateAsync({ id: task.id, payload: payload as any });
      // Rafraichit la liste des taches
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de deplacer la tache.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kanban</Text>
        <Text style={styles.count}>{tasks?.length ?? 0} taches</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        // Scroll horizontal pour naviguer entre les colonnes
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.board}
          style={{ flex: 1 }}
        >
          <KanbanColumn
            label="⏳ A faire"
            color="#F1F5F9"
            tasks={todoTasks}
            columnIndex={0}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
          />
          <KanbanColumn
            label="🔄 En cours"
            color="#EFF6FF"
            tasks={inProgressTasks}
            columnIndex={1}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
          />
          <KanbanColumn
            label="✅ Terminees"
            color="#F0FDF4"
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
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // En-tete
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
  count: { fontSize: 13, color: Colors.textSecondary },

  // Tableau Kanban
  board: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    alignItems: "flex-start",
  },

  // Colonne
  column: {
    width: 280,
    borderRadius: 12,
    padding: 12,
    height: 600,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  columnLabel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  columnCount: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  columnCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  columnContent: { gap: 8, paddingBottom: 8 },

  // Carte tache
  card: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  priorityBar: { height: 3 },
  cardContent: { padding: 12, gap: 8 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  cardDate: { fontSize: 11, color: Colors.textSecondary },
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  priorityText: { fontSize: 11, fontWeight: "600" },

  // Boutons de deplacement
  moveButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  moveButton: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 8,
    alignItems: "center",
  },
  moveButtonDisabled: { opacity: 0.2 },
  moveButtonText: { fontSize: 16, color: Colors.primary, fontWeight: "600" },

  // Colonne vide
  emptyColumn: { padding: 20, alignItems: "center" },
  emptyColumnText: { fontSize: 13, color: Colors.textTertiary },
});
