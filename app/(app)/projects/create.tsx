// =====================================================
// CreateProjectScreen — Creer un nouveau projet
// Formulaire avec : nom, description, priorite, dates
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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formate la date en YYYY-MM-DD pour l'API
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const payload = {
    name: name.trim(),
    description: description.trim() || undefined,
    priority: priority as any,
    startDate: startDate ? formatDateForApi(startDate) : undefined,
    endDate: endDate ? formatDateForApi(endDate) : undefined,
  };
  console.log("Payload creation projet:", JSON.stringify(payload));

  // Formate la date pour l'affichage
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Soumet le formulaire
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom du projet est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        priority: priority as any,
        startDate: startDate ? formatDateForApi(startDate) : undefined,
        endDate: endDate ? formatDateForApi(endDate) : undefined,
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
      console.log("Status:", error?.response?.status);
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
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text
              style={[
                styles.dateButtonText,
                !startDate && styles.datePlaceholder,
              ]}
            >
              {startDate
                ? formatDateForDisplay(startDate)
                : "📅 Choisir une date"}
            </Text>
            {startDate && (
              <TouchableOpacity
                onPress={() => setStartDate(null)}
                style={styles.clearDate}
              >
                <Text style={styles.clearDateText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") setShowStartPicker(false);
                if (event.type === "dismissed") {
                  setShowStartPicker(false);
                  return;
                }
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}
          {showStartPicker && Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.confirmDateButton}
              onPress={() => setShowStartPicker(false)}
            >
              <Text style={styles.confirmDateText}>Confirmer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date de fin */}
        <View style={styles.field}>
          <Text style={styles.label}>Date de fin</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text
              style={[
                styles.dateButtonText,
                !endDate && styles.datePlaceholder,
              ]}
            >
              {endDate ? formatDateForDisplay(endDate) : "📅 Choisir une date"}
            </Text>
            {endDate && (
              <TouchableOpacity
                onPress={() => setEndDate(null)}
                style={styles.clearDate}
              >
                <Text style={styles.clearDateText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={startDate ?? new Date()}
              onChange={(event, selectedDate) => {
                if (Platform.OS === "android") setShowEndPicker(false);
                if (event.type === "dismissed") {
                  setShowEndPicker(false);
                  return;
                }
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}
          {showEndPicker && Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.confirmDateButton}
              onPress={() => setShowEndPicker(false)}
            >
              <Text style={styles.confirmDateText}>Confirmer</Text>
            </TouchableOpacity>
          )}
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

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateButtonText: { fontSize: 15, color: Colors.textPrimary },
  datePlaceholder: { color: Colors.textTertiary },
  clearDate: { padding: 4 },
  clearDateText: { fontSize: 14, color: Colors.textTertiary },
  confirmDateButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  confirmDateText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
});
