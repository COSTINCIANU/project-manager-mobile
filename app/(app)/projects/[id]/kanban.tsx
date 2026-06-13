// =====================================================
// KanbanScreen — Vue Kanban d'un projet
// Affiche les tâches organisées en 3 colonnes :
// À faire / En cours / Terminées
// Scroll horizontal entre les colonnes
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTasks } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";
import { Task } from "@/types/task";

// =====================
// DÉFINITION DES COLONNES
// Chaque colonne a un id, un label et une couleur de fond
// =====================
const COLUMNS = [
  { id: "todo", label: "⏳ À faire", color: "#F1F5F9" },
  { id: "inProgress", label: "🔄 En cours", color: "#EFF6FF" },
  { id: "done", label: "✅ Terminées", color: "#F0FDF4" },
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
// COMPOSANT CARTE TÂCHE KANBAN
// Version compacte de la carte pour le Kanban
// =====================
function KanbanCard({ task }: { task: Task }) {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? Colors.textTertiary;

  return (
    <View style={styles.card}>
      {/* Barre de priorité en haut de la carte */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.cardContent}>
        {/* Nom de la tâche */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {task.name}
        </Text>

        {/* Date d'échéance si définie */}
        {task.dueDate && (
          <Text style={styles.cardDate}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}

        {/* Badge de priorité */}
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
      </View>
    </View>
  );
}

// =====================
// COMPOSANT COLONNE KANBAN
// Affiche une colonne avec son titre et ses cartes
// =====================
function KanbanColumn({
  label,
  color,
  tasks,
}: {
  label: string;
  color: string;
  tasks: Task[];
}) {
  return (
    <View style={[styles.column, { backgroundColor: color }]}>
      {/* En-tête de la colonne avec compteur */}
      <View style={styles.columnHeader}>
        <Text style={styles.columnLabel}>{label}</Text>
        <View style={styles.columnCount}>
          <Text style={styles.columnCountText}>{tasks.length}</Text>
        </View>
      </View>

      {/* Liste des cartes de la colonne */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
      >
        {tasks.length === 0 ? (
          // Message si la colonne est vide
          <View style={styles.emptyColumn}>
            <Text style={styles.emptyColumnText}>Aucune tâche</Text>
          </View>
        ) : (
          tasks.map((task) => <KanbanCard key={task.id} task={task} />)
        )}
      </ScrollView>
    </View>
  );
}

// =====================
// ÉCRAN PRINCIPAL KANBAN
// =====================
export default function KanbanScreen() {
  // Récupère l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Charge les tâches du projet
  const { data: tasks, isLoading } = useTasks(Number(id));

  // Répartit les tâches dans les 3 colonnes
  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Kanban</Text>
        <Text style={styles.count}>{tasks?.length ?? 0} tâches</Text>
      </View>

      {/* Indicateur de chargement */}
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
          <KanbanColumn label="⏳ À faire" color="#F1F5F9" tasks={todoTasks} />
          <KanbanColumn
            label="🔄 En cours"
            color="#EFF6FF"
            tasks={inProgressTasks}
          />
          <KanbanColumn
            label="✅ Terminées"
            color="#F0FDF4"
            tasks={doneTasks}
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

  // En-tête
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

  // Tableau Kanban — scroll horizontal
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
    // maxHeight: '100%',
    height: 600, // ← hauteur fixe au lieu de maxHeight
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

  // Carte tâche
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

  // Colonne vide
  emptyColumn: { padding: 20, alignItems: "center" },
  emptyColumnText: { fontSize: 13, color: Colors.textTertiary },
});
