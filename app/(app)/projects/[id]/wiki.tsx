// =====================================================
// WikiScreen — Wiki du projet
// Affiche les pages wiki du projet
// Permet de creer, modifier et supprimer des pages
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

  // Etats
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Champs du formulaire
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charge les pages wiki du projet
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

  // Cree une nouvelle page wiki
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
      console.log("Erreur creation wiki:", error?.response?.data);
      Alert.alert("Erreur", "Impossible de creer la page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modifie une page wiki
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

  // Supprime une page wiki
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

  // Ouvre l'editeur de creation
  const openCreate = () => {
    setTitle("");
    setContent("");
    setIsCreating(true);
    setIsEditing(false);
    setSelectedPage(null);
  };

  // Ouvre l'editeur de modification
  const openEdit = (page: WikiPage) => {
    setTitle(page.title);
    setContent(page.content);
    setIsEditing(true);
    setIsCreating(false);
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

  // Affiche le formulaire de creation ou modification
  if (isCreating || isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        {/* En-tete formulaire */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setIsCreating(false);
              setIsEditing(false);
            }}
            style={styles.backButton}
          >
            <Text style={styles.backText}>✕ Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isCreating ? "Nouvelle page" : "Modifier"}
          </Text>
          <TouchableOpacity
            onPress={isCreating ? handleCreate : handleUpdate}
            disabled={isSubmitting}
            style={[
              styles.saveButton,
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
          {/* Titre de la page */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Titre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Titre de la page..."
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              maxLength={100}
            />
          </View>

          {/* Contenu de la page */}
          <View style={styles.field}>
            <Text style={styles.label}>Contenu</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contenu de la page wiki..."
              placeholderTextColor={Colors.textTertiary}
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

  // Affiche le detail d'une page
  if (selectedPage) {
    return (
      <SafeAreaView style={styles.container}>
        {/* En-tete detail */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setSelectedPage(null)}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {selectedPage.title}
          </Text>
          {/* Boutons modifier et supprimer */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => openEdit(selectedPage)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(selectedPage.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Contenu de la page */}
          <View style={styles.pageContent}>
            <Text style={styles.pageText}>
              {selectedPage.content || "Aucun contenu"}
            </Text>
          </View>
          {/* Date de mise a jour */}
          <Text style={styles.pageDate}>
            Mise a jour le{" "}
            {new Date(selectedPage.updatedAt).toLocaleDateString("fr-FR")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Affiche la liste des pages wiki
  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete liste */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wiki</Text>
        {/* Bouton creer une nouvelle page */}
        <TouchableOpacity onPress={openCreate} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Page</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {pages.length === 0 ? (
          // Message si aucune page
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Aucune page wiki</Text>
            <Text style={styles.emptySubtext}>
              Cliquez sur "+ Page" pour creer votre premiere page
            </Text>
            <TouchableOpacity onPress={openCreate} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>+ Creer une page</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Liste des pages
          pages.map((page) => (
            <TouchableOpacity
              key={page.id}
              style={styles.pageCard}
              onPress={() => setSelectedPage(page)}
              activeOpacity={0.7}
            >
              <View style={styles.pageCardContent}>
                <Text style={styles.pageTitle}>📄 {page.title}</Text>
                <Text style={styles.pagePreview} numberOfLines={2}>
                  {page.content || "Aucun contenu"}
                </Text>
                <Text style={styles.pageDate}>
                  {new Date(page.updatedAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <Text style={styles.pageArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15, color: Colors.primary },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginHorizontal: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  addButtonText: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  editButton: {
    padding: 8,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  editButtonText: { fontSize: 16 },
  deleteButton: {
    padding: 8,
    backgroundColor: Colors.danger + "15",
    borderRadius: 20,
  },
  deleteButtonText: { fontSize: 16 },

  // Contenu
  content: { padding: 16, gap: 12 },

  // Champs formulaire
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  required: { color: Colors.danger },
  input: {
    backgroundColor: Colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 200,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  // Carte page
  pageCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  pageCardContent: { flex: 1, gap: 4 },
  pageTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  pagePreview: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  pageDate: { fontSize: 11, color: Colors.textTertiary },
  pageArrow: { fontSize: 20, color: Colors.textTertiary },

  // Detail page
  pageContent: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  pageText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },

  // Etat vide
  empty: { padding: 40, alignItems: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: "600", color: Colors.textPrimary },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyButtonText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
});
