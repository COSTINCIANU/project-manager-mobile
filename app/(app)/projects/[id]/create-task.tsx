// =====================================================
// CreateTaskScreen — Creer une nouvelle tache
// Formulaire de creation avec les champs :
// nom, description, type de ticket, priorite, date echeance
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
import { useState } from "react";
import { useCreateTask } from "@/hooks/useTasks";
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

// Types de tickets disponibles — comme Jira
const TICKET_TYPES = [
  { value: "task", label: "Tâche", icon: "✅", color: "#378ADD" },
  { value: "bug", label: "Bug", icon: "🐛", color: "#E74C3C" },
  { value: "story", label: "Story", icon: "📖", color: "#27AE60" },
  { value: "epic", label: "Épic", icon: "⚡", color: "#9B7FD4" },
];

export default function CreateTaskScreen() {
  // Recupere l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const createTask = useCreateTask();
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  // ETATS — champs du formulaire
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normale");
  const [ticketType, setTicketType] = useState("task");
  const [dueDate, setDueDate] = useState("");
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

  // Soumet le formulaire de creation
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Champ requis", "Le nom de la tache est obligatoire.");
      return;
    }
    if (dueDate && !isValidDate(dueDate)) {
      Alert.alert(
        "Date invalide",
        "Format attendu : JJ/MM/AAAA (ex: 17/08/2027)",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        ticketType,
        projectId: Number(id),
        dueDate: dueDate.trim() ? formatDateForApi(dueDate.trim()) : undefined,
        done: false,
        inProgress: false,
        status: "active",
        color: "#6366F1",
        progress: 0,
      } as any);
      Alert.alert("Succes", "Tache creee avec succes !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de creer la tache.");
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
          Nouvelle tache
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

      {/* Formulaire — centre sur tablette */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type de ticket — comme Jira */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Type de ticket
          </Text>
          <View style={styles.ticketTypesRow}>
            {TICKET_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.ticketTypeOption,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundPrimary,
                  },
                  ticketType === t.value && {
                    backgroundColor: t.color,
                    borderColor: t.color,
                  },
                ]}
                onPress={() => setTicketType(t.value)}
              >
                <Text style={styles.ticketTypeIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.ticketTypeText,
                    { color: theme.textSecondary },
                    ticketType === t.value && { color: "#FFFFFF" },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
            placeholder="Nom de la tache..."
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
          />
        </View>

        {/* Description — optionnel */}
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

        {/* Date d'echeance */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            Date d'echeance
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
            value={dueDate}
            onChangeText={setDueDate}
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
  // Types de tickets
  ticketTypesRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  ticketTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  ticketTypeIcon: { fontSize: 14 },
  ticketTypeText: { fontSize: 13, fontWeight: "500" },
  // Priorites
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
