// =====================================================
// EditTaskScreen — Modifier une tache existante
// Meme formulaire que la creation mais pre-rempli
// avec les donnees actuelles de la tache
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
import { useState, useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTask, useUpdateTask } from "@/hooks/useTasks";
import { Colors } from "@/constants/colors";

// Priorites disponibles
const PRIORITIES = [
  { value: "faible", label: "Faible", color: Colors.priorityLow },
  { value: "normale", label: "Normale", color: Colors.info },
  { value: "haute", label: "Haute", color: Colors.priorityHigh },
  { value: "critique", label: "Critique", color: Colors.priorityCritical },
];

export default function EditTaskScreen() {
  // Recupere l'ID de la tache depuis l'URL
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  console.log("EditTask — id:", id, "taskId:", taskId);
  const router = useRouter();

  // Charge la tache existante
  const { data: task, isLoading } = useTask(Number(taskId));
  console.log("EditTask — isLoading:", isLoading, "task:", task);
  const updateTask = useUpdateTask();

  // Champs du formulaire — initialises avec les donnees de la tache
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normale");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [done, setDone] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-remplit le formulaire quand la tache est chargee
  useEffect(() => {
    if (task) {
      setName(task.name ?? "");
      setDescription(task.description ?? "");
      setPriority(task.priority ?? "normale");
      setDone(task.done ?? false);
      setInProgress(task.inProgress ?? false);
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate));
      }
    }
  }, [task]);

  // Formate la date en YYYY-MM-DD pour l'API
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Formate la date pour l'affichage
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Soumet les modifications
  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom de la tache est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask.mutateAsync({
        id: Number(taskId),
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate ? formatDateForApi(dueDate) : undefined,
          done,
          inProgress,
        } as any,
      });

      //   Option 1
      //   Alert.alert("Succes", "Tache modifiee avec succes !", [
      //     {
      //       text: "OK",
      //       // Retourne au detail de la tache apres modification
      //       onPress: () => router.back(),
      //     },
      //   ]);

      //   Option 2
      //   Alert.alert("Succes", "Tache modifiee avec succes !", [
      //     {
      //       text: "OK",
      //       // Retourne directement a la liste des projets apres modification
      //       onPress: () => router.replace("/(app)/projects" as any),
      //     },
      //   ]);

      //   Option 3
      Alert.alert("Succes", "Tache modifiee avec succes !", [
        {
          text: "Voir les projets",
          // Retourne a la liste des projets
          onPress: () => router.replace("/(app)/projects" as any),
        },
        {
          text: "Rester ici",
          // Reste sur la page actuelle
          onPress: () => router.back(),
          style: "cancel",
        },
      ]);
    } catch (error: any) {
      console.log("Erreur modification tache:", error?.response?.data);
      Alert.alert("Erreur", "Impossible de modifier la tache.");
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
        <Text style={styles.title}>Modifier la tache</Text>
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
        {/* Statut de la tache */}
        <View style={styles.field}>
          <Text style={styles.label}>Statut</Text>
          <View style={styles.statusRow}>
            {/* Bouton A faire */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                !done && !inProgress && styles.statusOptionActive,
              ]}
              onPress={() => {
                setDone(false);
                setInProgress(false);
              }}
            >
              <Text
                style={[
                  styles.statusText,
                  !done && !inProgress && styles.statusTextActive,
                ]}
              >
                ⏳ A faire
              </Text>
            </TouchableOpacity>
            {/* Bouton En cours */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                inProgress && !done && styles.statusOptionInProgress,
              ]}
              onPress={() => {
                setDone(false);
                setInProgress(true);
              }}
            >
              <Text
                style={[
                  styles.statusText,
                  inProgress && !done && styles.statusTextActive,
                ]}
              >
                🔄 En cours
              </Text>
            </TouchableOpacity>
            {/* Bouton Termine */}
            <TouchableOpacity
              style={[styles.statusOption, done && styles.statusOptionDone]}
              onPress={() => {
                setDone(true);
                setInProgress(false);
              }}
            >
              <Text
                style={[styles.statusText, done && styles.statusTextActive]}
              >
                ✅ Termine
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nom */}
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
            maxLength={100}
          />
        </View>

        {/* Description */}
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

        {/* Date d'echeance */}
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
              <TouchableOpacity
                onPress={() => setDueDate(null)}
                style={styles.clearDate}
              >
                <Text style={styles.clearDateText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
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

  // Statut
  statusRow: { flexDirection: "row", gap: 8 },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundPrimary,
    alignItems: "center",
  },
  statusOptionActive: {
    backgroundColor: Colors.textTertiary + "20",
    borderColor: Colors.textTertiary,
  },
  statusOptionInProgress: {
    backgroundColor: Colors.warning + "20",
    borderColor: Colors.warning,
  },
  statusOptionDone: {
    backgroundColor: Colors.success + "20",
    borderColor: Colors.success,
  },
  statusText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500" },
  statusTextActive: { color: Colors.textPrimary, fontWeight: "600" },

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

  // Date
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
