// =====================================================
// KanbanScreen — Vue Kanban d'un projet
// Affiche les taches organisees en 3 colonnes :
// A faire / En cours / Terminees
// Sur mobile : boutons ← → pour deplacer les taches
// Sur tablette : boutons "Reculer" et "Avancer" plus larges
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
import { useBreakpoint } from "@/hooks/useBreakpoint";
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
// COMPOSANT KanbanCard
// Affiche une carte tache avec boutons de deplacement
// PROPS :
//   task         — la tache a afficher
//   onMoveLeft   — fonction appelee quand on clique ←
//   onMoveRight  — fonction appelee quand on clique →
//   canMoveLeft  — boolean : peut-on aller a gauche ?
//   canMoveRight — boolean : peut-on aller a droite ?
//   isTablet     — boolean : true si on est sur tablette
// =====================================================
function KanbanCard({
  task,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  isTablet,
}: {
  task: Task;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  isTablet: boolean;
}) {
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Couleur de la barre de priorite selon la priorite de la tache
  const priorityColor = PRIORITY_COLORS[task.priority] ?? theme.textTertiary;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
    >
      {/* Barre coloree en haut de la carte selon la priorite */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.cardContent}>
        {/* Nom de la tache — 2 lignes max */}
        <Text
          style={[styles.cardTitle, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {task.name}
        </Text>

        {/* Date d'echeance — affichee seulement si definie */}
        {task.dueDate && (
          <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        )}

        {/* Badge de priorite colore */}
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

        {/* Sur mobile — boutons fleches compacts ← → */}
        {!isTablet && (
          <View style={styles.moveButtons}>
            {/* Bouton ← desactive si premiere colonne */}
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
            {/* Bouton → desactive si derniere colonne */}
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
        )}

        {/* Sur tablette — boutons avec texte plus lisibles */}
        {isTablet && (
          <View style={styles.moveButtons}>
            {/* Bouton Reculer desactive si premiere colonne */}
            <TouchableOpacity
              onPress={onMoveLeft}
              disabled={!canMoveLeft}
              style={[
                styles.moveButtonTablet,
                { backgroundColor: theme.primary + "15" },
                !canMoveLeft && styles.moveButtonDisabled,
              ]}
            >
              <Text style={[styles.moveButtonText, { color: theme.primary }]}>
                ← Reculer
              </Text>
            </TouchableOpacity>
            {/* Bouton Avancer desactive si derniere colonne */}
            <TouchableOpacity
              onPress={onMoveRight}
              disabled={!canMoveRight}
              style={[
                styles.moveButtonTablet,
                { backgroundColor: theme.primary + "15" },
                !canMoveRight && styles.moveButtonDisabled,
              ]}
            >
              <Text style={[styles.moveButtonText, { color: theme.primary }]}>
                Avancer →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// =====================================================
// COMPOSANT KanbanColumn
// Affiche une colonne du kanban avec ses taches
// PROPS :
//   label       — titre de la colonne (ex: "A faire")
//   color       — couleur fond mode clair
//   darkColor   — couleur fond mode sombre
//   tasks       — tableau des taches de cette colonne
//   onMoveLeft  — fonction pour deplacer une tache a gauche
//   onMoveRight — fonction pour deplacer une tache a droite
//   columnIndex — position de la colonne (0=gauche, 2=droite)
//   isTablet    — boolean : true si on est sur tablette
// =====================================================
function KanbanColumn({
  label,
  color,
  darkColor,
  tasks,
  onMoveLeft,
  onMoveRight,
  columnIndex,
  isTablet,
}: {
  label: string;
  color: string;
  darkColor: string;
  tasks: Task[];
  onMoveLeft: (task: Task) => void;
  onMoveRight: (task: Task) => void;
  columnIndex: number;
  isTablet: boolean;
}) {
  // Hook theme — retourne les couleurs et isDark selon mode clair/sombre
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.column,
        // Couleur de fond selon le theme clair ou sombre
        { backgroundColor: isDark ? darkColor : color },
        // Colonne plus large sur tablette
        isTablet && { width: 340 },
      ]}
    >
      {/* En-tete de la colonne avec compteur de taches */}
      <View style={styles.columnHeader}>
        <Text style={[styles.columnLabel, { color: theme.textPrimary }]}>
          {label}
        </Text>
        {/* Badge avec le nombre de taches dans cette colonne */}
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

      {/* Liste des cartes avec scroll vertical */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.columnContent}
      >
        {tasks.length === 0 ? (
          // Message si la colonne est vide
          <View style={styles.emptyColumn}>
            <Text
              style={[styles.emptyColumnText, { color: theme.textTertiary }]}
            >
              Aucune tache
            </Text>
          </View>
        ) : (
          // Une carte par tache — isTablet transmis a KanbanCard
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              // Peut aller a gauche seulement si pas dans la premiere colonne
              canMoveLeft={columnIndex > 0}
              // Peut aller a droite seulement si pas dans la derniere colonne
              canMoveRight={columnIndex < 2}
              onMoveLeft={() => onMoveLeft(task)}
              onMoveRight={() => onMoveRight(task)}
              isTablet={isTablet}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================
// COMPOSANT PRINCIPAL KanbanScreen
// =====================================================
export default function KanbanScreen() {
  // Recupere l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();

  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  // Charge les taches du projet depuis l'API
  const { data: tasks, isLoading } = useTasks(Number(id));

  // Repartit les taches dans les 3 colonnes selon leur statut
  const todoTasks = tasks?.filter((t) => !t.done && !t.inProgress) ?? [];
  const inProgressTasks = tasks?.filter((t) => t.inProgress && !t.done) ?? [];
  const doneTasks = tasks?.filter((t) => t.done) ?? [];

  // Deplace une tache vers la colonne de gauche
  const handleMoveLeft = async (task: Task) => {
    try {
      let payload = {};
      // En cours → A faire
      if (task.inProgress) payload = { done: false, inProgress: false };
      // Termine → En cours
      else if (task.done) payload = { done: false, inProgress: true };
      await updateTask.mutateAsync({ id: task.id, payload: payload as any });
      // Rafraichit la liste des taches apres deplacement
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de deplacer la tache.");
    }
  };

  // Deplace une tache vers la colonne de droite
  const handleMoveRight = async (task: Task) => {
    try {
      let payload = {};
      // A faire → En cours
      if (!task.inProgress && !task.done)
        payload = { done: false, inProgress: true };
      // En cours → Termine
      else if (task.inProgress) payload = { done: true, inProgress: false };
      await updateTask.mutateAsync({ id: task.id, payload: payload as any });
      // Rafraichit la liste des taches apres deplacement
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      Alert.alert("Erreur", "Impossible de deplacer la tache.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete avec bouton retour et compteur de taches */}
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
        // Scroll horizontal pour naviguer entre les 3 colonnes
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={[
            styles.board,
            // Plus de padding et gap sur tablette
            isTablet && { padding: 24, gap: 16 },
          ]}
          style={{ flex: 1 }}
        >
          {/* Colonne A faire — index 0 */}
          <KanbanColumn
            label="⏳ A faire"
            color="#F1F5F9"
            darkColor="#1E293B"
            tasks={todoTasks}
            columnIndex={0}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
            isTablet={isTablet}
          />
          {/* Colonne En cours — index 1 */}
          <KanbanColumn
            label="🔄 En cours"
            color="#EFF6FF"
            darkColor="#1E3A5F"
            tasks={inProgressTasks}
            columnIndex={1}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
            isTablet={isTablet}
          />
          {/* Colonne Terminees — index 2 */}
          <KanbanColumn
            label="✅ Terminees"
            color="#F0FDF4"
            darkColor="#14532D"
            tasks={doneTasks}
            columnIndex={2}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
            isTablet={isTablet}
          />
        </ScrollView>
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
  count: { fontSize: 13 },
  board: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  // Colonne — 280px sur mobile, 340px sur tablette via prop isTablet
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
  // Bouton deplacement mobile — compact avec fleche
  moveButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  // Bouton deplacement tablette — plus large avec texte
  moveButtonTablet: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  moveButtonDisabled: { opacity: 0.2 },
  moveButtonText: { fontSize: 13, fontWeight: "600" },
  emptyColumn: { padding: 20, alignItems: "center" },
  emptyColumnText: { fontSize: 13 },
});
