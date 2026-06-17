// =====================================================
// EditTaskScreen — Modifier une tache existante
// Formulaire pre-rempli avec les donnees actuelles
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
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
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(Number(taskId));
  const updateTask = useUpdateTask();

  // Champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normale");
  const [dueDate, setDueDate] = useState("");
  const [done, setDone] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-remplit le formulaire avec les donnees de la tache
  useEffect(() => {
    if (task) {
      setName(task.name ?? "");
      setDescription(task.description ?? "");
      setPriority(task.priority ?? "normale");
      setDone(task.done ?? false);
      setInProgress(task.inProgress ?? false);
      setDueDate(task.dueDate ?? "");
    }
  }, [task]);

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

  // Soumet les modifications
  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom de la tache est obligatoire.");
      return;
    }
    if (dueDate && !isValidDate(dueDate)) {
      Alert.alert(
        "Date invalide",
        "Format attendu : AAAA-MM-JJ (ex: 2026-12-31)",
      );
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
          // Convertit la date du format francais JJ/MM/AAAA vers AAAA-MM-JJ pour l'API
          dueDate: dueDate.trim()
            ? formatDateForApi(dueDate.trim())
            : undefined,
          done,
          inProgress,
        } as any,
      });

      Alert.alert("Succes", "Tache modifiee avec succes !", [
        {
          text: "Voir les projets",
          onPress: () => router.replace("/(app)/projects" as any),
        },
        {
          text: "Retour a la tache",
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

        {/* Date d'echeance — champ texte simple */}
        <View style={styles.field}>
          <Text style={styles.label}>Date d'echeance</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: 17/08/2027"
            placeholderTextColor={Colors.textTertiary}
            value={dueDate}
            onChangeText={setDueDate}
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
