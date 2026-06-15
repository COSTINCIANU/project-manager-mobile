// =====================================================
// TaskDetailScreen — Detail d'une tache
// Affiche les infos, sous-taches, commentaires
// et fichiers attaches a la tache
// Permet d'ajouter des commentaires et des fichiers
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
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useTask } from "@/hooks/useTasks";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors } from "@/constants/colors";

// =====================
// TYPES
// =====================

// Type pour un commentaire de tache
interface Comment {
  id: number;
  content: string;
  author: { name: string; email: string };
  createdAt: string;
}

// Type pour un fichier attache — adapte a la reponse de l'API Symfony
// L'API retourne : id, filename, path, mimeType, uploadedAt, url
interface Attachment {
  id: number;
  filename: string;
  path: string;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

// Type pour une sous-tache
interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

// Un composant en React Native c'est la fonction principale du fichier
// dans ce cas TaskDetailScreen

export default function TaskDetailScreen() {
  // Recupere l'ID de la tache depuis l'URL (ex: /tasks/3)
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Charge les details de la tache via React Query
  const { data: task, isLoading } = useTask(Number(id));

  // queryClient permet d'invalider le cache React Query
  // pour forcer le rechargement des donnees apres une action
  const queryClient = useQueryClient();

  // Etats locaux
  const [comments, setComments] = useState<Comment[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Charge les donnees au demarrage
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  // Charge commentaires, sous-taches et fichiers en parallele
  // const loadData = async () => {
  //   try {
  //     const [commentsRes, taskRes, attachmentsRes] = await Promise.all([
  //       apiClient.get(API_ENDPOINTS.COMMENTS(Number(id))),
  //       apiClient.get(API_ENDPOINTS.TASK(Number(id))),
  //       apiClient.get(API_ENDPOINTS.ATTACHMENTS(Number(id))),
  //     ]);
  //     setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
  //     setSubtasks(taskRes.data?.subTasks ?? []);
  //     setAttachments(
  //       Array.isArray(attachmentsRes.data) ? attachmentsRes.data : [],
  //     );
  //   } catch (error) {
  //     console.log("Erreur chargement:", error);
  //   } finally {
  //     setLoadingData(false);
  //   }
  // };

  const loadData = async () => {
    try {
      const [commentsRes, attachmentsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.COMMENTS(Number(id))),
        apiClient.get(API_ENDPOINTS.ATTACHMENTS(Number(id))),
      ]);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
      // Utilise les sous-taches deja chargees via useTask
      setSubtasks(task?.subTasks ?? []);
      setAttachments(
        Array.isArray(attachmentsRes.data) ? attachmentsRes.data : [],
      );
    } catch (error) {
      console.log("Erreur chargement:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Envoie un nouveau commentaire
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

  // Coche ou decoche une sous-tache
  const handleToggleSubtask = async (subtask: SubTask) => {
    try {
      await apiClient.put(API_ENDPOINTS.SUBTASK(subtask.id), {
        completed: !subtask.completed,
      });
      // Met a jour l'etat local immediatement sans recharger
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtask.id ? { ...s, completed: !s.completed } : s,
        ),
      );
    } catch (error) {
      console.log("Erreur toggle subtask:", error);
    }
  };

  // Ouvre le selecteur de fichier et uploade le fichier choisi
  const handleUploadFile = async () => {
    try {
      // Ouvre le selecteur de document (tous types de fichiers)
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      // Si l'utilisateur a annule, on arrete
      if (result.canceled) return;

      const file = result.assets[0];
      setUploadingFile(true);

      // Prepare le FormData pour l'envoi multipart au backend
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType ?? "application/octet-stream",
        name: file.name,
      } as any);

      // Envoie le fichier au backend Symfony
      const { data } = await apiClient.post(
        API_ENDPOINTS.ATTACHMENTS(Number(id)),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      // Ajoute le fichier a la liste locale sans recharger
      setAttachments((prev) => [...prev, data]);
      Alert.alert("Succes", "Fichier uploade avec succes !");
    } catch (error) {
      console.log("Erreur upload fichier:", error);
      Alert.alert("Erreur", "Impossible d'uploader le fichier.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Supprime un fichier attache avec confirmation
  const handleDeleteAttachment = async (attachmentId: number) => {
    Alert.alert("Supprimer", "Voulez-vous supprimer ce fichier ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(API_ENDPOINTS.ATTACHMENT(attachmentId));
            setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer le fichier.");
          }
        },
      },
    ]);
  };

  // Retourne une icone selon le type MIME du fichier
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes("image")) return "🖼";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("zip") || mimeType.includes("rar")) return "🗜";
    return "📎";
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
        {/* En-tete avec bouton retour et bouton modifier */}
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
          {/* Bouton modifier la tache */}
          <TouchableOpacity
            onPress={() => {
              console.log(
                "task.projectId:",
                task.projectId,
                "task.id:",
                task.id,
              );
              router.push(
                `/(app)/projects/${task.projectId}/edit-task?taskId=${task.id}` as any,
              );
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>✏️ Modifier</Text>
          </TouchableOpacity>

          {/* Bouton supprimer la tache */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Supprimer",
                "Voulez-vous vraiment supprimer cette tache ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await apiClient.delete(API_ENDPOINTS.TASK(Number(id)));
                        // Invalide le cache React Query pour mettre a jour la liste
                        queryClient.invalidateQueries({ queryKey: ["tasks"] });
                        // Retourne a la liste des taches apres suppression
                        router.replace("/(app)/tasks" as any);
                      } catch (error) {
                        Alert.alert(
                          "Erreur",
                          "Impossible de supprimer la tache.",
                        );
                      }
                    },
                  },
                ],
              );
            }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Badges statut et priorite */}
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

          {/* Description de la tache */}
          {task.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          ) : null}

          {/* Date d'echeance */}
          {task.dueDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date d'echeance</Text>
              <Text style={styles.dueDate}>
                📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}

          {/* Sous-taches avec cases a cocher */}
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
                  {/* Case a cocher verte si completee */}
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

          {/* Fichiers attaches */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Fichiers ({attachments.length})
              </Text>
              {/* Bouton pour ajouter un fichier */}
              <TouchableOpacity
                onPress={handleUploadFile}
                disabled={uploadingFile}
                style={styles.uploadButton}
              >
                {uploadingFile ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.uploadButtonText}>+ Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Liste des fichiers ou message vide */}
            {attachments.length === 0 ? (
              <Text style={styles.emptyText}>Aucun fichier attache</Text>
            ) : (
              attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentRow}>
                  {/* Icone selon le type MIME */}
                  <Text style={styles.attachmentIcon}>
                    {getFileIcon(attachment.mimeType)}
                  </Text>
                  <View style={styles.attachmentInfo}>
                    {/* Nom du fichier */}
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.filename}
                    </Text>
                    {/* Date d'upload a la place de la taille */}
                    <Text style={styles.attachmentSize}>
                      {new Date(attachment.uploadedAt).toLocaleDateString(
                        "fr-FR",
                      )}
                    </Text>
                  </View>
                  {/* Bouton supprimer */}
                  <TouchableOpacity
                    onPress={() => handleDeleteAttachment(attachment.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Commentaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Commentaires ({comments.length})
            </Text>

            {loadingData ? (
              <ActivityIndicator color={Colors.primary} />
            ) : comments.length === 0 ? (
              <Text style={styles.emptyText}>Aucun commentaire</Text>
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

        {/* Zone de saisie pour ajouter un commentaire */}
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
          {/* Bouton envoyer le commentaire */}
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

  // Badges statut et priorite
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

  // Sections generiques
  section: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textTertiary,
    textTransform: "uppercase",
  },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  dueDate: { fontSize: 14, color: Colors.textPrimary },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    padding: 8,
  },

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

  // Fichiers
  uploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  uploadButtonText: { fontSize: 13, color: Colors.primary, fontWeight: "500" },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  attachmentIcon: { fontSize: 20 },
  attachmentInfo: { flex: 1 },
  attachmentName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  attachmentSize: { fontSize: 11, color: Colors.textTertiary },
  deleteButton: { padding: 4 },
  deleteButtonText: { fontSize: 16 },

  // Commentaires
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

  // Zone saisie commentaire en bas
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

  // {/* En-tete avec bouton retour et bouton modifier */}
  editButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  editButtonText: { fontSize: 12, color: Colors.primary, fontWeight: "500" },
});
