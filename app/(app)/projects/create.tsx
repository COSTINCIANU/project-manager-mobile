// =====================================================
// CreateProjectScreen — Creer un nouveau projet
// Formulaire avec : nom, description, priorite, dates
// Note : DatePicker natif desactive pour Expo Go
// Theme clair/sombre automatique selon le systeme
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
import { useRouter } from "expo-router";
import { useState } from "react";
import { useCreateProject } from "@/hooks/useProjects";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/colors";

// Priorites disponibles — couleurs fixes independamment du theme
const PRIORITIES = [
  { value: "low", label: "Faible", color: Colors.priorityLow },
  { value: "medium", label: "Moyenne", color: Colors.priorityMedium },
  { value: "high", label: "Haute", color: Colors.priorityHigh },
  { value: "critical", label: "Critique", color: Colors.priorityCritical },
];

export default function CreateProjectScreen() {
  const router = useRouter();
  const createProject = useCreateProject();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  // Champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valide le format de date JJ/MM/AAAA
  const isValidDate = (date: string): boolean => {
    if (!date) return true;
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(date);
  };

  // Convertit JJ/MM/AAAA en AAAA-MM-JJ pour l'API
  const formatDateForApi = (date: string): string => {
    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`;
  };

  // Soumet le formulaire
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom du projet est obligatoire.");
      return;
    }
    if (startDate && !isValidDate(startDate)) {
      Alert.alert(
        "Date invalide",
        "Format attendu : JJ/MM/AAAA (ex: 17/08/2027)",
      );
      return;
    }
    if (endDate && !isValidDate(endDate)) {
      Alert.alert(
        "Date invalide",
        "Format attendu : JJ/MM/AAAA (ex: 17/08/2027)",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
        // Convertit les dates du format francais JJ/MM/AAAA vers AAAA-MM-JJ pour l'API
        startDate: startDate.trim()
          ? formatDateForApi(startDate.trim())
          : undefined,
        endDate: endDate.trim() ? formatDateForApi(endDate.trim()) : undefined,
        // Champs requis par le backend Symfony
        status: "active",
        color: "#6366F1",
        progress: 0,
      } as any);

      Alert.alert("Succes", "Projet cree avec succes !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.log(
        "Erreur creation projet:",
        JSON.stringify(error?.response?.data),
      );
      Alert.alert("Erreur", "Impossible de creer le projet.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Nouveau projet
        </Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isSubmitting || !name.trim()}
          style={[
            styles.createButton,
            { backgroundColor: theme.primary },
            (!name.trim() || isSubmitting) && styles.createButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Creer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nom — obligatoire */}
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
            autoFocus
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Description
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
            placeholder="Description du projet (optionnel)..."
            placeholderTextColor={theme.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Priorite */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Priorite
          </Text>
          <View style={styles.prioritiesRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityOption,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundPrimary,
                  },
                  priority === p.value && {
                    backgroundColor: p.color,
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPriority(p.value)}
              >
                <Text
                  style={[
                    styles.priorityOptionText,
                    { color: theme.textSecondary },
                    priority === p.value && styles.priorityOptionTextSelected,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date de debut */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Date de debut
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
            placeholder="ex: 17/08/2027"
            placeholderTextColor={theme.textTertiary}
            value={startDate}
            onChangeText={setStartDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={[styles.hint, { color: theme.textTertiary }]}>
            Format : JJ/MM/AAAA
          </Text>
        </View>

        {/* Date de fin */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Date de fin
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
            placeholder="ex: 17/08/2027"
            placeholderTextColor={theme.textTertiary}
            value={endDate}
            onChangeText={setEndDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={[styles.hint, { color: theme.textTertiary }]}>
            Format : JJ/MM/AAAA
          </Text>
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
  createButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createButtonDisabled: { opacity: 0.4 },
  createButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  content: { padding: 20, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  hint: { fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: "top", paddingTop: 12 },
  prioritiesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  priorityOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  priorityOptionText: { fontSize: 13, fontWeight: "500" },
  priorityOptionTextSelected: { color: "#FFFFFF" },
});
