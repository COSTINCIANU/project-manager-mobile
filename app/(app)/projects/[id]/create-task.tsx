// =====================================================
// CreateTaskScreen — Creer une nouvelle tache
// Formulaire avec selecteur de date natif iOS/Android
// Champs : nom, description, priorite, date echeance
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCreateTask } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";

// Priorites disponibles selon le backend Symfony
const PRIORITIES = [
  { value: "faible", label: "Faible", color: Colors.priorityLow },
  { value: "normale", label: "Normale", color: Colors.info },
  { value: "haute", label: "Haute", color: Colors.priorityHigh },
  { value: "critique", label: "Critique", color: Colors.priorityCritical },
];

export default function CreateTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const createTask = useCreateTask();

  // Champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normale");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formate la date en YYYY-MM-DD pour l'API
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Formate la date pour l'affichage en francais
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Soumet le formulaire de creation
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom de la tache est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: Number(id),
        dueDate: dueDate ? formatDateForApi(dueDate) : undefined,
        done: false,
        inProgress: false,
      } as any);

      Alert.alert("Succes", "Tache creee avec succes !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.log("Erreur creation tache:", error?.response?.data);
      Alert.alert("Erreur", "Impossible de creer la tache.");
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
        <Text style={styles.title}>Nouvelle tache</Text>
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
            placeholder="Nom de la tache..."
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
          />
        </View>

        {/* Description — optionnel */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optionnel)..."
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

        {/* Date d'echeance — selecteur natif */}
        <View style={styles.field}>
          <Text style={styles.label}>Date d'echeance</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.dateButtonText,
                !dueDate && styles.datePlaceholder,
              ]}
            >
              {dueDate ? formatDateForDisplay(dueDate) : "📅 Choisir une date"}
            </Text>
            {dueDate && (
              // Bouton pour effacer la date
              <TouchableOpacity
                onPress={() => setDueDate(null)}
                style={styles.clearDate}
              >
                <Text style={styles.clearDateText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Selecteur de date natif iOS/Android */}
          {showDatePicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                // Sur Android, ferme automatiquement apres selection
                if (Platform.OS === "android") {
                  setShowDatePicker(false);
                }
                if (event.type === "dismissed") {
                  setShowDatePicker(false);
                  return;
                }
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}

          {/* Bouton confirmer sur iOS */}
          {showDatePicker && Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.confirmDateButton}
              onPress={() => setShowDatePicker(false)}
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
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  createButtonDisabled: { opacity: 0.4 },
  createButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },

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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  // Priorite
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

  // Date picker
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
