// =====================================================
// EditTaskScreen — Modifier une tache existante
// Formulaire pre-rempli avec les donnees actuelles
// Note : DatePicker natif desactive pour Expo Go
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
import { useTask, useUpdateTask } from "@/hooks/useTasks";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Colors } from "@/constants/colors";

// Priorites disponibles — couleurs fixes independamment du theme
const PRIORITIES = [
  { value: "faible", label: "Faible", color: Colors.priorityLow },
  { value: "normale", label: "Normale", color: Colors.info },
  { value: "haute", label: "Haute", color: Colors.priorityHigh },
  { value: "critique", label: "Critique", color: Colors.priorityCritical },
];

export default function EditTaskScreen() {
  // Recupere l'ID du projet et de la tache depuis l'URL
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(Number(taskId));
  const updateTask = useUpdateTask();
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  // ETATS — champs du formulaire
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
      Alert.alert("Date invalide", "Format attendu : JJ/MM/AAAA (ex: 17/08/2027)");
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
          dueDate: dueDate.trim() ? formatDateForApi(dueDate.trim()) : undefined,
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
      Alert.alert("Erreur", "Impossible de modifier la tache.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: Colors.danger }]}>✕ Annuler</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Modifier la tache</Text>
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
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Statut de la tache */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>Statut</Text>
          <View style={styles.statusRow}>
            {/* Bouton A faire */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundPrimary,
                },
                !done &&
                  !inProgress && {
                    backgroundColor: theme.textTertiary + "20",
                    borderColor: theme.textTertiary,
                  },
              ]}
              onPress={() => {
                setDone(false);
                setInProgress(false);
              }}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: theme.textSecondary },
                  !done &&
                    !inProgress && {
                      color: theme.textPrimary,
                      fontWeight: "600",
                    },
                ]}
              >
                ⏳ A faire
              </Text>
            </TouchableOpacity>
            {/* Bouton En cours */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundPrimary,
                },
                inProgress &&
                  !done && {
                    backgroundColor: Colors.warning + "20",
                    borderColor: Colors.warning,
                  },
              ]}
              onPress={() => {
                setDone(false);
                setInProgress(true);
              }}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: theme.textSecondary },
                  inProgress && !done && { color: theme.textPrimary, fontWeight: "600" },
                ]}
              >
                🔄 En cours
              </Text>
            </TouchableOpacity>
            {/* Bouton Termine */}
            <TouchableOpacity
              style={[
                styles.statusOption,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundPrimary,
                },
                done && {
                  backgroundColor: Colors.success + "20",
                  borderColor: Colors.success,
                },
              ]}
              onPress={() => {
                setDone(true);
                setInProgress(false);
              }}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: theme.textSecondary },
                  done && { color: theme.textPrimary, fontWeight: "600" },
                ]}
              >
                ✅ Termine
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nom */}
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
            placeholder="Nom de la tache..."
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>Description</Text>
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
            placeholder="Description (optionnel)..."
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
          <Text style={[styles.label, { color: theme.textPrimary }]}>Priorite</Text>
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

        {/* Date d'echeance */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>Date d'echeance</Text>
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
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Text style={[styles.hint, { color: theme.textTertiary }]}>Format : JJ/MM/AAAA</Text>
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
  hint: { fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: { minHeight: 100, textAlignVertical: "top", paddingTop: 12 },
  statusRow: { flexDirection: "row", gap: 8 },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  statusText: { fontSize: 12, fontWeight: "500" },
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
