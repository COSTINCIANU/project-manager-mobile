// =====================================================
// EditProjectScreen — Modifier un projet existant
// Formulaire pre-rempli avec les donnees du projet
// Champs : nom, statut, couleur
// Theme clair/sombre automatique selon le systeme
// Sur tablette : formulaire centre avec largeur max
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Colors } from "@/constants/colors";

// Statuts disponibles pour un projet
const STATUSES = [
  { value: "active", label: "🟢 Actif" },
  { value: "completed", label: "✅ Termine" },
  { value: "archived", label: "📦 Archive" },
];

// Couleurs disponibles — fixes independamment du theme
const PROJECT_COLORS = [
  { value: "#6366F1", label: "Indigo" },
  { value: "#22C55E", label: "Vert" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#EF4444", label: "Rouge" },
  { value: "#3B82F6", label: "Bleu" },
  { value: "#8B5CF6", label: "Violet" },
];

export default function EditProjectScreen() {
  // Recupere l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  const { data: project, isLoading } = useProject(Number(id));
  const updateProject = useUpdateProject();

  // ETATS — champs du formulaire
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [color, setColor] = useState("#6366F1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-remplit le formulaire avec les donnees du projet
  useEffect(() => {
    if (project) {
      setName(project.name ?? "");
      setStatus(project.status ?? "active");
      setColor(project.color ?? "#6366F1");
    }
  }, [project]);

  // Soumet les modifications
  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom du projet est obligatoire.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateProject.mutateAsync({
        id: Number(id),
        payload: { name: name.trim(), status: status as any, color },
      });
      Alert.alert("Succes", "Projet modifie avec succes !", [
        {
          text: "Voir les projets",
          onPress: () => router.replace("/(app)/projects" as any),
        },
        {
          text: "Retour au projet",
          onPress: () => router.back(),
          style: "cancel",
        },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de modifier le projet.");
    } finally {
      setIsSubmitting(false);
    }
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
          <Text style={[styles.backText, { color: Colors.danger }]}>
            ✕ Annuler
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Modifier le projet
        </Text>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isSubmitting || !name.trim()}
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            (!name.trim() || isSubmitting) && styles.saveButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Sauver</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Formulaire — centre sur tablette */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nom du projet */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Nom <Text style={{ color: Colors.danger }}>*</Text>
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
            placeholder="Nom du projet..."
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Statut du projet */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Statut
          </Text>
          <View style={styles.optionsRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.statusOption,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundPrimary,
                  },
                  // Statut actif — fond primaire leger
                  status === s.value && {
                    backgroundColor: theme.primary + "20",
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setStatus(s.value)}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: theme.textSecondary },
                    status === s.value && {
                      color: theme.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Couleur du projet */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Couleur
          </Text>
          <View style={styles.colorsRow}>
            {PROJECT_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: c.value },
                  // Coche blanche si couleur selectionnee
                  color === c.value && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(c.value)}
              >
                {color === c.value && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 17, fontWeight: "600" },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  // Contenu mobile
  content: { padding: 20, gap: 20 },
  // Contenu tablette — centre avec largeur max
  contentTablet: {
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
    padding: 32,
  },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  optionsRow: { gap: 8 },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: { fontSize: 14 },
  colorsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
});
