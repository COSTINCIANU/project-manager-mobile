// =====================================================
// TaskDetailScreen — Detail d'une tache
// Affiche les infos, sous-taches et commentaires
// Permet d'ajouter des commentaires
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useTask } from "@/hooks/useTasks";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors } from "@/constants/colors";

// Type commentaire
interface Comment {
  id: number;
  content: string;
  author: { name: string; email: string };
  createdAt: string;
}

// Type sous-tache
interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(Number(id));

  const [comments, setComments] = useState<Comment[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  // Charge les commentaires et sous-taches
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [commentsRes, taskRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.COMMENTS(Number(id))),
        apiClient.get(API_ENDPOINTS.TASK(Number(id))),
      ]);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      setSubtasks(taskRes.data?.subTasks ?? []);
    } catch (error) {
      console.log("Erreur chargement:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Envoie un commentaire
  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.COMMENTS(Number(id)),
        { content: newComment.trim() },
      );
      setComments((prev) => [...prev, data]);
      setNewComment("");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer le commentaire.");
    } finally {
      setSendingComment(false);
    }
  };

  // Coche/decoche une sous-tache
  const handleToggleSubtask = async (subtask: SubTask) => {
    try {
      await apiClient.put(API_ENDPOINTS.SUBTASK(subtask.id), {
        completed: !subtask.completed,
      });
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtask.id ? { ...s, completed: !s.completed } : s,
        ),
      );
    } catch (error) {
      console.log("Erreur toggle subtask:", error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!task) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* En-tete */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {task.name}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Statut et priorite */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: task.done
                    ? Colors.success + "20"
                    : task.inProgress
                      ? Colors.warning + "20"
                      : Colors.textTertiary + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: task.done
                      ? Colors.success
                      : task.inProgress
                        ? Colors.warning
                        : Colors.textTertiary,
                  },
                ]}
              >
                {task.done
                  ? "✅ Termine"
                  : task.inProgress
                    ? "🔄 En cours"
                    : "⏳ A faire"}
              </Text>
            </View>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>{task.priority}</Text>
            </View>
          </View>

          {/* Description */}
          {task.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          ) : null}

          {/* Date echeance */}
          {task.dueDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date d'echeance</Text>
              <Text style={styles.dueDate}>
                📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}

          {/* Sous-taches */}
          {subtasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Sous-taches ({subtasks.filter((s) => s.completed).length}/
                {subtasks.length})
              </Text>
              {subtasks.map((subtask) => (
                <TouchableOpacity
                  key={subtask.id}
                  style={styles.subtaskRow}
                  onPress={() => handleToggleSubtask(subtask)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      subtask.completed && styles.checkboxDone,
                    ]}
                  >
                    {subtask.completed && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.subtaskTitle,
                      subtask.completed && styles.subtaskDone,
                    ]}
                  >
                    {subtask.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Commentaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Commentaires ({comments.length})
            </Text>

            {loadingComments ? (
              <ActivityIndicator color={Colors.primary} />
            ) : comments.length === 0 ? (
              <Text style={styles.emptyComments}>
                Aucun commentaire pour l'instant
              </Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.author?.name ??
                        comment.author?.email ??
                        "Utilisateur"}
                    </Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Zone de saisie commentaire */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={Colors.textTertiary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || sendingComment) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendComment}
            disabled={!newComment.trim() || sendingComment}
          >
            {sendingComment ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },

  // Contenu
  content: { padding: 16, gap: 16 },

  // Badges statut/priorite
  badgesRow: { flexDirection: "row", gap: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: "500" },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  priorityText: { fontSize: 13, color: Colors.textSecondary },

  // Sections
  section: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textTertiary,
    textTransform: "uppercase",
  },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  dueDate: { fontSize: 14, color: Colors.textPrimary },

  // Sous-taches
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: { fontSize: 12, color: "#FFFFFF", fontWeight: "700" },
  subtaskTitle: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  subtaskDone: {
    textDecorationLine: "line-through",
    color: Colors.textTertiary,
  },

  // Commentaires
  emptyComments: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    padding: 8,
  },
  commentCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  commentHeader: { flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  commentDate: { fontSize: 11, color: Colors.textTertiary },
  commentContent: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Zone saisie commentaire
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    backgroundColor: Colors.backgroundPrimary,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
});
