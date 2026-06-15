// =====================================================
// EditProjectScreen — Modifier un projet existant
// Formulaire pre-rempli avec les donnees du projet
// Champs : nom, statut, couleur, description, dates
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
import { Colors } from "@/constants/colors";

// Statuts disponibles pour un projet
const STATUSES = [
  { value: "active", label: "🟢 Actif" },
  { value: "completed", label: "✅ Termine" },
  { value: "archived", label: "📦 Archive" },
];

// Couleurs disponibles pour un projet
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

  // Charge le projet existant
  const { data: project, isLoading } = useProject(Number(id));
  const updateProject = useUpdateProject();

  // Champs du formulaire
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
        payload: {
          name: name.trim(),
          status: status as any,
          color,
        },
      });

      Alert.alert("Succes", "Projet modifie avec succes !", [
        {
          text: "Voir les projets",
          // Retourne a la liste des projets
          onPress: () => router.replace("/(app)/projects" as any),
        },
        {
          text: "Retour au projet",
          // Retourne au detail du projet
          onPress: () => router.back(),
          style: "cancel",
        },
      ]);
    } catch (error: any) {
      console.log("Erreur modification projet:", error?.response?.data);
      Alert.alert("Erreur", "Impossible de modifier le projet.");
    } finally {
      setIsSubmitting(false);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>✕ Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le projet</Text>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isSubmitting || !name.trim()}
          style={[
            styles.saveButton,
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nom du projet */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Nom <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du projet..."
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Statut du projet */}
        <View style={styles.field}>
          <Text style={styles.label}>Statut</Text>
          <View style={styles.optionsRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.statusOption,
                  status === s.value && styles.statusOptionActive,
                ]}
                onPress={() => setStatus(s.value)}
              >
                <Text
                  style={[
                    styles.statusText,
                    status === s.value && styles.statusTextActive,
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
          <Text style={styles.label}>Couleur</Text>
          <View style={styles.colorsRow}>
            {PROJECT_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: c.value },
                  color === c.value && styles.colorOptionSelected,
                ]}
                onPress={() => setColor(c.value)}
              >
                {/* Coche si couleur selectionnee */}
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
  backText: { fontSize: 15, color: Colors.danger },
  title: { fontSize: 17, fontWeight: "600", color: Colors.textPrimary },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },

  // Contenu
  content: { padding: 20, gap: 20 },

  // Champs
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

  // Statuts
  optionsRow: { gap: 8 },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundPrimary,
  },
  statusOptionActive: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  statusText: { fontSize: 14, color: Colors.textSecondary },
  statusTextActive: { color: Colors.primary, fontWeight: "600" },

  // Couleurs
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
