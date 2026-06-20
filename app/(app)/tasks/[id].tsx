// =====================================================
// TaskDetailScreen — Detail d'une tache
// Affiche les infos, sous-taches, commentaires
// et fichiers attaches a la tache
// Theme clair/sombre automatique selon le systeme
// Sur tablette : layout 2 colonnes
//   Gauche : infos, sous-taches, fichiers
//   Droite : commentaires
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
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Colors } from "@/constants/colors";

// Type pour un commentaire
interface Comment {
  id: number;
  content: string;
  author: { name: string; email: string };
  createdAt: string;
}

// Type pour un fichier attache
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

export default function TaskDetailScreen() {
  // Recupere l'ID de la tache depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(Number(id));
  const queryClient = useQueryClient();
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  // ETATS — donnees chargees depuis l'API
  const [comments, setComments] = useState<Comment[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // ETATS — formulaires et chargement
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  // Charge les donnees au demarrage
  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  // Charge commentaires, fichiers et sous-taches en parallele
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
      setSubtasks((prev) =>
        prev.map((s) =>
          s.id === subtask.id ? { ...s, completed: !s.completed } : s,
        ),
      );
    } catch (error) {
      console.log("Erreur toggle subtask:", error);
    }
  };

  // Ajoute une nouvelle sous-tache
  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.SUBTASKS(Number(id)),
        { name: newSubtask.trim() },
      );
      setSubtasks((prev) => [
        ...prev,
        { id: data.id, title: data.name, completed: data.done ?? false },
      ]);
      setNewSubtask("");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter la sous-tache.");
    } finally {
      setAddingSubtask(false);
    }
  };

  // Supprime une sous-tache avec confirmation
  const handleDeleteSubtask = async (subtaskId: number) => {
    Alert.alert("Supprimer", "Voulez-vous supprimer cette sous-tache ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(API_ENDPOINTS.SUBTASK(subtaskId));
            setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer la sous-tache.");
          }
        },
      },
    ]);
  };

  // Ouvre le selecteur de fichier et uploade
  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType ?? "application/octet-stream",
        name: file.name,
      } as any);
      const { data } = await apiClient.post(
        API_ENDPOINTS.ATTACHMENTS(Number(id)),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setAttachments((prev) => [...prev, data]);
      Alert.alert("Succes", "Fichier uploade avec succes !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'uploader le fichier.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Supprime un fichier avec confirmation
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
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!task) return null;

  // =====================================================
  // CONTENU COLONNE GAUCHE — infos, sous-taches, fichiers
  // Utilise sur mobile (inline) et tablette (colonne)
  // =====================================================
  const LeftContent = () => (
    <>
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
                  : theme.textTertiary + "20",
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
                    : theme.textTertiary,
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
        <View
          style={[
            styles.priorityBadge,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.priorityText, { color: theme.textSecondary }]}>
            {task.priority}
          </Text>
        </View>
      </View>

      {/* Description */}
      {task.description ? (
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {task.description}
          </Text>
        </View>
      ) : null}

      {/* Date d'echeance */}
      {task.dueDate && (
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.backgroundPrimary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            Date d'echeance
          </Text>
          <Text style={[styles.dueDate, { color: theme.textPrimary }]}>
            📅 {new Date(task.dueDate).toLocaleDateString("fr-FR")}
          </Text>
        </View>
      )}

      {/* Sous-taches */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.backgroundPrimary,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            Sous-taches ({subtasks.filter((s) => s.completed).length}/
            {subtasks.length})
          </Text>
        </View>
        {subtasks.map((subtask) => (
          <View key={subtask.id} style={styles.subtaskRow}>
            <TouchableOpacity onPress={() => handleToggleSubtask(subtask)}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: theme.border },
                  subtask.completed && styles.checkboxDone,
                ]}
              >
                {subtask.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text
              style={[
                styles.subtaskTitle,
                { color: theme.textPrimary },
                subtask.completed && {
                  textDecorationLine: "line-through",
                  color: theme.textTertiary,
                },
              ]}
            >
              {subtask.title}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteSubtask(subtask.id)}>
              <Text style={{ fontSize: 14, color: Colors.danger }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {/* Champ ajout sous-tache */}
        <View style={styles.subtaskInputRow}>
          <TextInput
            style={[
              styles.subtaskInput,
              {
                borderColor: theme.border,
                color: theme.textPrimary,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            placeholder="Ajouter une sous-tache..."
            placeholderTextColor={theme.textTertiary}
            value={newSubtask}
            onChangeText={setNewSubtask}
            maxLength={100}
            onSubmitEditing={handleAddSubtask}
          />
          <TouchableOpacity
            onPress={handleAddSubtask}
            disabled={!newSubtask.trim() || addingSubtask}
            style={[
              styles.subtaskAddButton,
              { backgroundColor: theme.primary },
              (!newSubtask.trim() || addingSubtask) &&
                styles.sendButtonDisabled,
            ]}
          >
            {addingSubtask ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>+</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Fichiers */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.backgroundPrimary,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            Fichiers ({attachments.length})
          </Text>
          <TouchableOpacity
            onPress={handleUploadFile}
            disabled={uploadingFile}
            style={[
              styles.uploadButton,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            {uploadingFile ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.uploadButtonText, { color: theme.primary }]}>
                + Ajouter
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {attachments.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
            Aucun fichier attache
          </Text>
        ) : (
          attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentRow}>
              <Text style={styles.attachmentIcon}>
                {getFileIcon(attachment.mimeType)}
              </Text>
              <View style={styles.attachmentInfo}>
                <Text
                  style={[styles.attachmentName, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {attachment.filename}
                </Text>
                <Text
                  style={[styles.attachmentSize, { color: theme.textTertiary }]}
                >
                  {new Date(attachment.uploadedAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
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
    </>
  );

  // =====================================================
  // CONTENU COLONNE DROITE — commentaires
  // Utilise sur mobile (inline) et tablette (colonne)
  // =====================================================
  const RightContent = () => (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
        Commentaires ({comments.length})
      </Text>
      {loadingData ? (
        <ActivityIndicator color={theme.primary} />
      ) : comments.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
          Aucun commentaire
        </Text>
      ) : (
        comments.map((comment) => (
          <View
            key={comment.id}
            style={[
              styles.commentCard,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={styles.commentHeader}>
              <Text
                style={[styles.commentAuthor, { color: theme.textPrimary }]}
              >
                {comment.author?.name ?? comment.author?.email ?? "Utilisateur"}
              </Text>
              <Text style={[styles.commentDate, { color: theme.textTertiary }]}>
                {new Date(comment.createdAt).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <Text
              style={[styles.commentContent, { color: theme.textSecondary }]}
            >
              {comment.content}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          <Text
            style={[styles.title, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {task.name}
          </Text>
          {/* Bouton modifier la tache */}
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(app)/projects/${task.projectId}/edit-task?taskId=${task.id}` as any,
              )
            }
            style={[
              styles.editButton,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Text style={[styles.editButtonText, { color: theme.primary }]}>
              ✏️ Modifier
            </Text>
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
                        queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

        {isTablet ? (
          // =====================================================
          // LAYOUT TABLETTE — 2 colonnes sans zone de saisie fixe
          // =====================================================
          <ScrollView
            contentContainerStyle={styles.contentTablet}
            showsVerticalScrollIndicator={false}
          >
            {/* Colonne gauche — infos, sous-taches, fichiers */}
            <View style={styles.tabletLeft}>
              <LeftContent />
            </View>
            {/* Colonne droite — commentaires + saisie */}
            <View style={styles.tabletRight}>
              <RightContent />
              {/* Zone de saisie commentaire dans la colonne droite sur tablette */}
              <View
                style={[
                  styles.commentInputContainerTablet,
                  {
                    backgroundColor: theme.backgroundPrimary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      borderColor: theme.border,
                      color: theme.textPrimary,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  placeholder="Ajouter un commentaire..."
                  placeholderTextColor={theme.textTertiary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: theme.primary },
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
            </View>
          </ScrollView>
        ) : (
          // =====================================================
          // LAYOUT MOBILE — colonne unique avec saisie en bas
          // =====================================================
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <LeftContent />
              <RightContent />
            </ScrollView>
            {/* Zone de saisie fixe en bas sur mobile */}
            <View
              style={[
                styles.commentInputContainer,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor={theme.textTertiary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.primary },
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
          </>
        )}
      </KeyboardAvoidingView>
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
  title: { fontSize: 16, fontWeight: "600", flex: 1 },

  // Layout mobile — colonne unique
  content: { padding: 16, gap: 16 },
  // Layout tablette — 2 colonnes
  contentTablet: {
    padding: 24,
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
  },
  tabletLeft: { flex: 1, gap: 16 },
  tabletRight: { flex: 1, gap: 16 },

  badgesRow: { flexDirection: "row", gap: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: "500" },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  priorityText: { fontSize: 13 },
  section: { borderRadius: 12, padding: 16, gap: 10, borderWidth: 0.5 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
  description: { fontSize: 14, lineHeight: 20 },
  dueDate: { fontSize: 14 },
  emptyText: { fontSize: 14, textAlign: "center", padding: 8 },

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
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: { fontSize: 12, color: "#FFFFFF", fontWeight: "700" },
  subtaskTitle: { fontSize: 14, flex: 1 },
  subtaskInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  subtaskInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  subtaskAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Fichiers
  uploadButton: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  uploadButtonText: { fontSize: 13, fontWeight: "500" },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  attachmentIcon: { fontSize: 20 },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 13, fontWeight: "500" },
  attachmentSize: { fontSize: 11 },
  deleteButton: { padding: 4 },
  deleteButtonText: { fontSize: 16 },

  // Commentaires
  commentCard: { borderRadius: 8, padding: 12, gap: 6 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { fontSize: 13, fontWeight: "600" },
  commentDate: { fontSize: 11 },
  commentContent: { fontSize: 14, lineHeight: 20 },

  // Zone saisie mobile — fixe en bas
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
  },
  // Zone saisie tablette — dans la colonne droite
  commentInputContainerTablet: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    marginTop: 8,
  },

  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
  editButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  editButtonText: { fontSize: 12, fontWeight: "500" },
});
