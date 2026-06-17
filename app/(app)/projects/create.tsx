// =====================================================
// CreateProjectScreen — Creer un nouveau projet
// Formulaire avec : nom, description, priorite, dates
// Note : DatePicker natif desactive pour Expo Go
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
import { Colors } from "@/constants/colors";

// Priorites disponibles
const PRIORITIES = [
  { value: "low", label: "Faible", color: Colors.priorityLow },
  { value: "medium", label: "Moyenne", color: Colors.priorityMedium },
  { value: "high", label: "Haute", color: Colors.priorityHigh },
  { value: "critical", label: "Critique", color: Colors.priorityCritical },
];

export default function CreateProjectScreen() {
  const router = useRouter();
  const createProject = useCreateProject();

  // Champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // // Valide le format de date YYYY-MM-DD
  // const isValidDate = (date: string): boolean => {
  //   if (!date) return true;
  //   const regex = /^\d{4}-\d{2}-\d{2}$/;
  //   return regex.test(date);
  // };

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
    <SafeAreaView style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>✕ Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau projet</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isSubmitting || !name.trim()}
          style={[
            styles.createButton,
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
          <Text style={styles.label}>
            Nom <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du projet..."
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description du projet (optionnel)..."
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Priorite */}
        <View style={styles.field}>
          <Text style={styles.label}>Priorite</Text>
          <View style={styles.prioritiesRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityOption,
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
          <Text style={styles.label}>Date de debut</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 17/08/2027"
            placeholderTextColor={Colors.textTertiary}
            value={startDate}
            onChangeText={setStartDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={styles.hint}>Format : AAAA-MM-JJ</Text>
        </View>

        {/* Date de fin */}
        <View style={styles.field}>
          <Text style={styles.label}>Date de fin</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 17/08/2027"
            placeholderTextColor={Colors.textTertiary}
            value={endDate}
            onChangeText={setEndDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={styles.hint}>Format : JJ/MM/AAAA</Text>
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
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  createButtonDisabled: { opacity: 0.4 },
  createButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  content: { padding: 20, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  required: { color: Colors.danger },
  hint: { fontSize: 12, color: Colors.textTertiary },
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
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  prioritiesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  priorityOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundPrimary,
  },
  priorityOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  priorityOptionTextSelected: { color: "#FFFFFF" },
});
