// =====================================================
// BacklogScreen — Backlog et Sprints d'un projet
// Le backlog contient toutes les tâches non assignées
// Les sprints contiennent les tâches planifiées
// =====================================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Colors } from "@/constants/colors";

// Types
interface SprintTask {
  id: number;
  name: string;
  priority: string;
  ticketType: string;
  done: boolean;
  inProgress: boolean;
  dueDate: string | null;
}

interface Sprint {
  id: number;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  projectId: number;
  tasksCount: number;
  tasksDone: number;
  progression: number;
  tasks: SprintTask[];
}

// Icones par type de ticket
const TICKET_ICONS: Record<string, string> = {
  task: "✅",
  bug: "🐛",
  story: "📖",
  epic: "⚡",
};

// Couleurs par priorité
const PRIORITY_COLORS: Record<string, string> = {
  haute: Colors.priorityHigh,
  critique: Colors.priorityCritical,
  normale: Colors.info,
  faible: Colors.priorityLow,
};

// Couleurs par statut de sprint
const SPRINT_STATUS_COLORS: Record<string, string> = {
  planifie: "#888",
  actif: "#27AE60",
  termine: "#9B7FD4",
};

const SPRINT_STATUS_LABELS: Record<string, string> = {
  planifie: "Planifié",
  actif: "Actif",
  termine: "Terminé",
};

export default function BacklogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = parseInt(id);
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Onglet actif : backlog ou sprints
  const [ongletActif, setOngletActif] = useState<"backlog" | "sprints">(
    "backlog",
  );
  // Formulaire de création de sprint
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [nomSprint, setNomSprint] = useState("");
  const [objectifSprint, setObjectifSprint] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // Récupère le backlog
  const {
    data: backlog,
    isLoading: chargementBacklog,
    refetch: rechargerBacklog,
  } = useQuery<SprintTask[]>({
    queryKey: ["backlog", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        API_ENDPOINTS.SPRINT_BACKLOG(projectId),
      );
      return data;
    },
  });

  // Récupère les sprints
  const {
    data: sprints,
    isLoading: chargementSprints,
    refetch: rechargerSprints,
  } = useQuery<Sprint[]>({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        API_ENDPOINTS.SPRINTS_BY_PROJECT(projectId),
      );
      return data;
    },
  });

  // Création d'un sprint
  const creerSprint = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(API_ENDPOINTS.SPRINT_CREATE, {
        name: nomSprint,
        goal: objectifSprint || null,
        status: "planifie",
        startDate: dateDebut || null,
        endDate: dateFin || null,
        projectId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      setAfficherFormulaire(false);
      setNomSprint("");
      setObjectifSprint("");
      setDateDebut("");
      setDateFin("");
    },
    onError: () => Alert.alert("Erreur", "Impossible de créer le sprint."),
  });

  // Assigner une tâche du backlog à un sprint
  const assignerTache = useMutation({
    mutationFn: async ({
      sprintId,
      taskId,
    }: {
      sprintId: number;
      taskId: number;
    }) => {
      await apiClient.post(API_ENDPOINTS.SPRINT_ASSIGN_TASK(sprintId), {
        taskId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlog", projectId] });
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
    },
    onError: () => Alert.alert("Erreur", "Impossible d'assigner la tâche."),
  });

  // Retirer une tâche d'un sprint vers le backlog
  const retirerTache = useMutation({
    mutationFn: async ({
      sprintId,
      taskId,
    }: {
      sprintId: number;
      taskId: number;
    }) => {
      await apiClient.post(API_ENDPOINTS.SPRINT_REMOVE_TASK(sprintId), {
        taskId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlog", projectId] });
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
    },
    onError: () => Alert.alert("Erreur", "Impossible de retirer la tâche."),
  });

  // Changer le statut d'un sprint
  const changerStatutSprint = useMutation({
    mutationFn: async ({
      sprintId,
      status,
    }: {
      sprintId: number;
      status: string;
    }) => {
      await apiClient.put(API_ENDPOINTS.SPRINT_UPDATE(sprintId), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
    },
  });

  // Demande à l'utilisateur dans quel sprint assigner une tâche
  const choisirSprint = (tache: SprintTask) => {
    if (!sprints || sprints.length === 0) {
      Alert.alert(
        "Aucun sprint",
        "Créez d'abord un sprint dans l'onglet Sprints.",
      );
      return;
    }

    const options = sprints
      .filter((s) => s.status !== "termine")
      .map((s) => ({
        text: s.name,
        onPress: () =>
          assignerTache.mutate({ sprintId: s.id, taskId: tache.id }),
      }));

    Alert.alert(
      "Assigner au sprint",
      `Choisir un sprint pour "${tache.name}"`,
      [...options, { text: "Annuler", style: "cancel" as const }],
    );
  };

  // Demande confirmation pour retirer une tâche du sprint
  const confirmerRetrait = (sprint: Sprint, tache: SprintTask) => {
    Alert.alert(
      "Retirer du sprint",
      `Remettre "${tache.name}" dans le backlog ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () =>
            retirerTache.mutate({ sprintId: sprint.id, taskId: tache.id }),
        },
      ],
    );
  };

  const isLoading = chargementBacklog || chargementSprints;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}
    >
      {/* En-tête */}
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
          style={styles.boutonRetour}
          onPress={() => router.back()}
        >
          <Text style={[styles.texteBoutonRetour, { color: theme.primary }]}>
            ← Retour
          </Text>
        </TouchableOpacity>
        <Text style={[styles.titre, { color: theme.textPrimary }]}>
          Backlog
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Onglets */}
      <View
        style={[
          styles.onglets,
          {
            backgroundColor: theme.backgroundSecondary,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.onglet,
            ongletActif === "backlog" && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setOngletActif("backlog")}
        >
          <Text
            style={[
              styles.texteOnglet,
              {
                color:
                  ongletActif === "backlog"
                    ? theme.primary
                    : theme.textSecondary,
              },
            ]}
          >
            📋 Backlog ({backlog?.length ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.onglet,
            ongletActif === "sprints" && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setOngletActif("sprints")}
        >
          <Text
            style={[
              styles.texteOnglet,
              {
                color:
                  ongletActif === "sprints"
                    ? theme.primary
                    : theme.textSecondary,
              },
            ]}
          >
            🏃 Sprints ({sprints?.length ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.contenu,
            isTablet && styles.contenuTablette,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                rechargerBacklog();
                rechargerSprints();
              }}
              tintColor={theme.primary}
            />
          }
        >
          {/* ===== ONGLET BACKLOG ===== */}
          {ongletActif === "backlog" && (
            <View style={styles.section}>
              <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
                Tâches non assignées à un sprint
              </Text>

              {backlog && backlog.length === 0 ? (
                <View style={styles.vide}>
                  <Text
                    style={[styles.texteVide, { color: theme.textSecondary }]}
                  >
                    Le backlog est vide 🎉{"\n"}Toutes les tâches sont dans un
                    sprint !
                  </Text>
                </View>
              ) : (
                <View style={styles.listeTaches}>
                  {backlog?.map((tache) => (
                    <View
                      key={tache.id}
                      style={[
                        styles.carteTache,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.enteteCarteTache}>
                        <Text style={styles.iconeType}>
                          {TICKET_ICONS[tache.ticketType] ?? "✅"}
                        </Text>
                        <Text
                          style={[
                            styles.nomTache,
                            { color: theme.textPrimary },
                          ]}
                          numberOfLines={2}
                        >
                          {tache.name}
                        </Text>
                      </View>
                      <View style={styles.piedCarteTache}>
                        <View
                          style={[
                            styles.badgePriorite,
                            {
                              backgroundColor:
                                (PRIORITY_COLORS[tache.priority] ?? "#888") +
                                "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.texteBadgePriorite,
                              {
                                color:
                                  PRIORITY_COLORS[tache.priority] ?? "#888",
                              },
                            ]}
                          >
                            {tache.priority}
                          </Text>
                        </View>
                        {/* Bouton assigner au sprint */}
                        <TouchableOpacity
                          style={[
                            styles.boutonAssigner,
                            { backgroundColor: theme.primary },
                          ]}
                          onPress={() => choisirSprint(tache)}
                        >
                          <Text style={styles.texteBoutonAssigner}>
                            → Sprint
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ===== ONGLET SPRINTS ===== */}
          {ongletActif === "sprints" && (
            <View style={styles.section}>
              {/* Bouton créer un sprint */}
              <TouchableOpacity
                style={[
                  styles.boutonCreerSprint,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => setAfficherFormulaire(!afficherFormulaire)}
              >
                <Text style={styles.texteBoutonCreerSprint}>
                  + Nouveau sprint
                </Text>
              </TouchableOpacity>

              {/* Formulaire de création */}
              {afficherFormulaire && (
                <View
                  style={[
                    styles.formulaire,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.formulaireTitre,
                      { color: theme.textPrimary },
                    ]}
                  >
                    Nouveau sprint
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundPrimary,
                        color: theme.textPrimary,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Nom du sprint (ex: Sprint 1)"
                    placeholderTextColor={theme.textSecondary}
                    value={nomSprint}
                    onChangeText={setNomSprint}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundPrimary,
                        color: theme.textPrimary,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Objectif (optionnel)"
                    placeholderTextColor={theme.textSecondary}
                    value={objectifSprint}
                    onChangeText={setObjectifSprint}
                  />
                  <View style={styles.rangeDates}>
                    <TextInput
                      style={[
                        styles.inputDate,
                        {
                          backgroundColor: theme.backgroundPrimary,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Début JJ/MM/AAAA"
                      placeholderTextColor={theme.textSecondary}
                      value={dateDebut}
                      onChangeText={setDateDebut}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                    />
                    <TextInput
                      style={[
                        styles.inputDate,
                        {
                          backgroundColor: theme.backgroundPrimary,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Fin JJ/MM/AAAA"
                      placeholderTextColor={theme.textSecondary}
                      value={dateFin}
                      onChangeText={setDateFin}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                    />
                  </View>

                  <View style={styles.boutonsFormulaire}>
                    <TouchableOpacity
                      style={[
                        styles.boutonAnnuler,
                        { borderColor: theme.border },
                      ]}
                      onPress={() => setAfficherFormulaire(false)}
                    >
                      <Text
                        style={[
                          styles.texteBoutonAnnuler,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Annuler
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.boutonCreer,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => {
                        if (!nomSprint.trim()) {
                          Alert.alert("Erreur", "Le nom du sprint est requis.");
                          return;
                        }
                        creerSprint.mutate();
                      }}
                      disabled={creerSprint.isPending}
                    >
                      {creerSprint.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.texteBoutonCreer}>Créer</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Liste des sprints */}
              {sprints && sprints.length === 0 ? (
                <View style={styles.vide}>
                  <Text
                    style={[styles.texteVide, { color: theme.textSecondary }]}
                  >
                    Aucun sprint créé.{"\n"}Cliquez sur "+ Nouveau sprint" pour
                    commencer.
                  </Text>
                </View>
              ) : (
                <View style={styles.listeSprints}>
                  {sprints?.map((sprint) => (
                    <View
                      key={sprint.id}
                      style={[
                        styles.carteSprint,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {/* En-tête du sprint */}
                      <View style={styles.enteteSprint}>
                        <View style={styles.infosSprint}>
                          <Text
                            style={[
                              styles.nomSprint,
                              { color: theme.textPrimary },
                            ]}
                          >
                            {sprint.name}
                          </Text>
                          <View
                            style={[
                              styles.badgeStatut,
                              {
                                backgroundColor:
                                  SPRINT_STATUS_COLORS[sprint.status] + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.texteStatut,
                                { color: SPRINT_STATUS_COLORS[sprint.status] },
                              ]}
                            >
                              {SPRINT_STATUS_LABELS[sprint.status]}
                            </Text>
                          </View>
                        </View>

                        {/* Boutons changer statut */}
                        <View style={styles.boutonsSprint}>
                          {sprint.status === "planifie" && (
                            <TouchableOpacity
                              style={[
                                styles.boutonStatut,
                                { backgroundColor: "#27AE60" },
                              ]}
                              onPress={() =>
                                changerStatutSprint.mutate({
                                  sprintId: sprint.id,
                                  status: "actif",
                                })
                              }
                            >
                              <Text style={styles.texteStatutBouton}>
                                ▶ Démarrer
                              </Text>
                            </TouchableOpacity>
                          )}
                          {sprint.status === "actif" && (
                            <TouchableOpacity
                              style={[
                                styles.boutonStatut,
                                { backgroundColor: "#9B7FD4" },
                              ]}
                              onPress={() =>
                                changerStatutSprint.mutate({
                                  sprintId: sprint.id,
                                  status: "termine",
                                })
                              }
                            >
                              <Text style={styles.texteStatutBouton}>
                                ✓ Terminer
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Objectif */}
                      {sprint.goal && (
                        <Text
                          style={[
                            styles.objectifSprint,
                            { color: theme.textSecondary },
                          ]}
                        >
                          🎯 {sprint.goal}
                        </Text>
                      )}

                      {/* Dates */}
                      {(sprint.startDate || sprint.endDate) && (
                        <Text
                          style={[
                            styles.datesSprint,
                            { color: theme.textSecondary },
                          ]}
                        >
                          📅 {sprint.startDate ?? "?"} → {sprint.endDate ?? "?"}
                        </Text>
                      )}

                      {/* Progression */}
                      <View style={styles.progressionSprint}>
                        <View
                          style={[
                            styles.barreProg,
                            { backgroundColor: theme.backgroundPrimary },
                          ]}
                        >
                          <View
                            style={[
                              styles.remplissageProg,
                              {
                                width: `${sprint.progression}%`,
                                backgroundColor: theme.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.texteProgression,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {sprint.tasksDone}/{sprint.tasksCount} tâches —{" "}
                          {sprint.progression}%
                        </Text>
                      </View>

                      {/* Tâches du sprint */}
                      {sprint.tasks.length > 0 && (
                        <View style={styles.tachesDuSprint}>
                          {sprint.tasks.map((tache) => (
                            <View
                              key={tache.id}
                              style={[
                                styles.ligneTache,
                                { borderBottomColor: theme.border },
                              ]}
                            >
                              <Text style={styles.iconeTypePetit}>
                                {TICKET_ICONS[tache.ticketType] ?? "✅"}
                              </Text>
                              <Text
                                style={[
                                  styles.nomTacheSprint,
                                  { color: theme.textPrimary },
                                  tache.done && styles.tacheTerminee,
                                ]}
                                numberOfLines={1}
                              >
                                {tache.name}
                              </Text>
                              <Text
                                style={[
                                  styles.statutTache,
                                  { color: theme.textSecondary },
                                ]}
                              >
                                {tache.done
                                  ? "✅"
                                  : tache.inProgress
                                    ? "🔄"
                                    : "⏳"}
                              </Text>
                              {/* Bouton retirer du sprint */}
                              <TouchableOpacity
                                onPress={() => confirmerRetrait(sprint, tache)}
                              >
                                <Text
                                  style={[
                                    styles.boutonRetirer,
                                    { color: theme.textSecondary },
                                  ]}
                                >
                                  ✕
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}

                      {sprint.tasks.length === 0 && (
                        <Text
                          style={[
                            styles.sprintVide,
                            { color: theme.textSecondary },
                          ]}
                        >
                          Aucune tâche — assignez des tâches depuis le backlog
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

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
  boutonRetour: { padding: 4, minWidth: 60 },
  texteBoutonRetour: { fontSize: 15 },
  titre: { fontSize: 18, fontWeight: "600" },
  onglets: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  onglet: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  texteOnglet: { fontSize: 14, fontWeight: "500" },
  centre: { flex: 1, justifyContent: "center", alignItems: "center" },
  contenu: { padding: 16, gap: 16 },
  contenuTablette: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    padding: 24,
  },
  section: { gap: 12 },
  sousTitre: { fontSize: 13 },
  vide: { padding: 40, alignItems: "center" },
  texteVide: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  listeTaches: { gap: 10 },
  carteTache: { borderRadius: 10, borderWidth: 0.5, padding: 12, gap: 8 },
  enteteCarteTache: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  iconeType: { fontSize: 14 },
  nomTache: { fontSize: 14, fontWeight: "500", flex: 1 },
  piedCarteTache: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgePriorite: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  texteBadgePriorite: { fontSize: 11, fontWeight: "600" },
  boutonAssigner: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  texteBoutonAssigner: { color: "#fff", fontSize: 12, fontWeight: "600" },
  boutonCreerSprint: { padding: 12, borderRadius: 10, alignItems: "center" },
  texteBoutonCreerSprint: { color: "#fff", fontSize: 14, fontWeight: "600" },
  formulaire: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  formulaireTitre: { fontSize: 16, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  rangeDates: { flexDirection: "row", gap: 8 },
  inputDate: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
  },
  boutonsFormulaire: { flexDirection: "row", gap: 10 },
  boutonAnnuler: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  texteBoutonAnnuler: { fontSize: 14 },
  boutonCreer: { flex: 2, padding: 12, borderRadius: 8, alignItems: "center" },
  texteBoutonCreer: { color: "#fff", fontSize: 14, fontWeight: "600" },
  listeSprints: { gap: 16 },
  carteSprint: { borderRadius: 12, borderWidth: 0.5, padding: 14, gap: 10 },
  enteteSprint: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  infosSprint: { flex: 1, gap: 4 },
  nomSprint: { fontSize: 16, fontWeight: "700" },
  badgeStatut: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  texteStatut: { fontSize: 11, fontWeight: "600" },
  boutonsSprint: { gap: 6 },
  boutonStatut: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  texteStatutBouton: { color: "#fff", fontSize: 12, fontWeight: "600" },
  objectifSprint: { fontSize: 13 },
  datesSprint: { fontSize: 12 },
  progressionSprint: { gap: 4 },
  barreProg: { height: 6, borderRadius: 3 },
  remplissageProg: { height: 6, borderRadius: 3 },
  texteProgression: { fontSize: 12 },
  tachesDuSprint: { gap: 0, borderRadius: 8, overflow: "hidden" },
  ligneTache: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  iconeTypePetit: { fontSize: 12 },
  nomTacheSprint: { flex: 1, fontSize: 13 },
  tacheTerminee: { textDecorationLine: "line-through" },
  statutTache: { fontSize: 13 },
  boutonRetirer: { fontSize: 16, padding: 4 },
  sprintVide: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
});
