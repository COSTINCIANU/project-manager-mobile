// =====================================================
// WikiScreen — Wiki du projet
// Affiche les pages wiki du projet
// Permet de creer, modifier et supprimer des pages
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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";

// Type pour une page wiki
interface WikiPage {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function WikiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadWikiPages();
  }, [id]);

  const loadWikiPages = async () => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.WIKI(Number(id)));
      setPages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erreur chargement wiki:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Champ requis", "Le titre est obligatoire.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.WIKI_CREATE, {
        title: title.trim(),
        content: content.trim(),
        projectId: Number(id),
      });
      setPages((prev) => [...prev, data]);
      setIsCreating(false);
      setTitle("");
      setContent("");
      Alert.alert("Succes", "Page wiki creee !");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de creer la page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!title.trim() || !selectedPage) return;
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.put(
        API_ENDPOINTS.WIKI_UPDATE(selectedPage.id),
        { title: title.trim(), content: content.trim() },
      );
      setPages((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      setIsEditing(false);
      setSelectedPage(data);
      Alert.alert("Succes", "Page modifiee !");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier la page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pageId: number) => {
    Alert.alert("Supprimer", "Voulez-vous supprimer cette page ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(API_ENDPOINTS.WIKI_DELETE(pageId));
            setPages((prev) => prev.filter((p) => p.id !== pageId));
            setSelectedPage(null);
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer la page.");
          }
        },
      },
    ]);
  };

  const openCreate = () => {
    setTitle("");
    setContent("");
    setIsCreating(true);
    setIsEditing(false);
    setSelectedPage(null);
  };
  const openEdit = (page: WikiPage) => {
    setTitle(page.title);
    setContent(page.content);
    setIsEditing(true);
    setIsCreating(false);
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

  // Formulaire creation/modification
  if (isCreating || isEditing) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
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
            onPress={() => {
              setIsCreating(false);
              setIsEditing(false);
            }}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: Colors.danger }]}>
              ✕ Annuler
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {isCreating ? "Nouvelle page" : "Modifier"}
          </Text>
          <TouchableOpacity
            onPress={isCreating ? handleCreate : handleUpdate}
            disabled={isSubmitting}
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary },
              isSubmitting && styles.saveButtonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Sauver</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Titre <Text style={{ color: Colors.danger }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Titre de la page..."
              placeholderTextColor={theme.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              maxLength={100}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textPrimary }]}>
              Contenu
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Contenu de la page wiki..."
              placeholderTextColor={theme.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={5000}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Detail d'une page
  if (selectedPage) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
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
            onPress={() => setSelectedPage(null)}
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
            {selectedPage.title}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => openEdit(selectedPage)}
              style={[
                styles.editButton,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(selectedPage.id)}
              style={[
                styles.deleteButton,
                { backgroundColor: Colors.danger + "15" },
              ]}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[
              styles.pageContent,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.pageText, { color: theme.textPrimary }]}>
              {selectedPage.content || "Aucun contenu"}
            </Text>
          </View>
          <Text style={[styles.pageDate, { color: theme.textTertiary }]}>
            Mise a jour le{" "}
            {new Date(selectedPage.updatedAt).toLocaleDateString("fr-FR")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Liste des pages wiki
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Wiki</Text>
        <TouchableOpacity
          onPress={openCreate}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.addButtonText}>+ Page</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {pages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
              Aucune page wiki
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Cliquez sur "+ Page" pour creer votre premiere page
            </Text>
            <TouchableOpacity
              onPress={openCreate}
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.emptyButtonText}>+ Creer une page</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pages.map((page) => (
            <TouchableOpacity
              key={page.id}
              style={[
                styles.pageCard,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setSelectedPage(page)}
              activeOpacity={0.7}
            >
              <View style={styles.pageCardContent}>
                <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
                  📄 {page.title}
                </Text>
                <Text
                  style={[styles.pagePreview, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {page.content || "Aucun contenu"}
                </Text>
                <Text style={[styles.pageDate, { color: theme.textTertiary }]}>
                  {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <Text style={[styles.pageArrow, { color: theme.textTertiary }]}>
                ›
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 17, fontWeight: "600", flex: 1, marginHorizontal: 8 },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButtonText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  editButton: { padding: 8, borderRadius: 20 },
  editButtonText: { fontSize: 16 },
  deleteButton: { padding: 8, borderRadius: 20 },
  deleteButtonText: { fontSize: 16 },
  content: { padding: 16, gap: 12 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 200, textAlignVertical: "top", paddingTop: 12 },
  pageCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
  },
  pageCardContent: { flex: 1, gap: 4 },
  pageTitle: { fontSize: 15, fontWeight: "600" },
  pagePreview: { fontSize: 13, lineHeight: 18 },
  pageDate: { fontSize: 11 },
  pageArrow: { fontSize: 20 },
  pageContent: { borderRadius: 12, padding: 16, borderWidth: 0.5 },
  pageText: { fontSize: 15, lineHeight: 22 },
  empty: { padding: 40, alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: "600" },
  emptySubtext: { fontSize: 14, textAlign: "center" },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyButtonText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
});
