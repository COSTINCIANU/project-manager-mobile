// =====================================================
// BurndownScreen — Burndown chart d'un sprint
// Affiche la progression réelle vs la ligne idéale
// Données enregistrées chaque nuit par le cron job
// =====================================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import Svg, {
  Line,
  Path,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "react-native-svg";

// Types
interface DonneeJour {
  date: string;
  tasksRemaining: number;
  tasksDone: number;
  tasksTotal: number;
}

interface LigneIdeale {
  date: string;
  tasksRemaining: number;
}

interface SprintInfo {
  id: number;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  tasksTotal: number;
  tasksDone: number;
  progression: number;
}

interface BurndownData {
  sprint: SprintInfo;
  donneesReelles: DonneeJour[];
  ligneIdeale: LigneIdeale[];
}

interface ProjectStats {
  totalTaches: number;
  parStatut: { aFaire: number; enCours: number; terminees: number };
  parType: Record<string, number>;
  parPriorite: Record<string, number>;
  sprints: Array<{
    id: number;
    name: string;
    status: string;
    tasksTotal: number;
    tasksDone: number;
    progression: number;
  }>;
}

// Couleurs fixes
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

export default function BurndownScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = parseInt(id);
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const router = useRouter();

  // Sprint sélectionné pour le burndown
  const [sprintSelectionne, setSprintSelectionne] = useState<number | null>(null);

  // Récupère les stats globales du projet
  const { data: stats, isLoading: chargementStats } = useQuery<ProjectStats>({
    queryKey: ["project-stats", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.REPORT_PROJECT_STATS(projectId));
      return data;
    },
  });

  // Récupère le burndown du sprint sélectionné
  const { data: burndown, isLoading: chargementBurndown } = useQuery<BurndownData>({
    queryKey: ["burndown", sprintSelectionne],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.REPORT_BURNDOWN(sprintSelectionne!));
      return data;
    },
    enabled: !!sprintSelectionne,
  });

  // Dimensions du graphique
  const largeurEcran = Dimensions.get("window").width;
  const largeurGraphique = isTablet ? 700 : largeurEcran - 48;
  const hauteurGraphique = 220;
  const paddingGauche = 40;
  const paddingBas = 30;
  const paddingHaut = 20;
  const largeurZone = largeurGraphique - paddingGauche - 20;
  const hauteurZone = hauteurGraphique - paddingBas - paddingHaut;

  // Génère le chemin SVG pour une série de données
  const genererChemin = (donnees: Array<{ tasksRemaining: number }>, maxTaches: number): string => {
    if (donnees.length === 0) return "";

    return donnees
      .map((d, i) => {
        const x = paddingGauche + (i / Math.max(donnees.length - 1, 1)) * largeurZone;
        const y =
          paddingHaut + ((maxTaches - d.tasksRemaining) / Math.max(maxTaches, 1)) * hauteurZone;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  // Formate la date JJ/MM
  const formaterDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const isLoading = chargementStats || chargementBurndown;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      <ScrollView contentContainerStyle={[styles.contenu, isTablet && styles.contenuTablette]}>
        {/* Bouton retour */}
        <TouchableOpacity style={styles.boutonRetour} onPress={() => router.back()}>
          <Text style={[styles.texteBoutonRetour, { color: theme.primary }]}>← Retour</Text>
        </TouchableOpacity>

        <Text style={[styles.titre, { color: theme.textPrimary }]}>📊 Rapports</Text>

        {chargementStats ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          stats && (
            <View style={styles.sections}>
              {/* Stats globales */}
              <View
                style={[
                  styles.carte,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>Vue globale</Text>
                <View style={styles.grilleStats}>
                  <View style={[styles.statItem, { backgroundColor: theme.backgroundPrimary }]}>
                    <Text style={[styles.statNombre, { color: theme.primary }]}>
                      {stats.totalTaches}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: theme.backgroundPrimary }]}>
                    <Text style={[styles.statNombre, { color: "#888" }]}>
                      {stats.parStatut.aFaire}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>À faire</Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: theme.backgroundPrimary }]}>
                    <Text style={[styles.statNombre, { color: "#F59E0B" }]}>
                      {stats.parStatut.enCours}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>En cours</Text>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: theme.backgroundPrimary }]}>
                    <Text style={[styles.statNombre, { color: "#27AE60" }]}>
                      {stats.parStatut.terminees}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Terminées
                    </Text>
                  </View>
                </View>
              </View>

              {/* Répartition par type */}
              {Object.keys(stats.parType).length > 0 && (
                <View
                  style={[
                    styles.carte,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                    Par type de ticket
                  </Text>
                  {Object.entries(stats.parType).map(([type, count]) => (
                    <View key={type} style={styles.ligneType}>
                      <Text style={styles.iconeType}>
                        {type === "bug"
                          ? "🐛"
                          : type === "story"
                            ? "📖"
                            : type === "epic"
                              ? "⚡"
                              : "✅"}
                      </Text>
                      <Text style={[styles.nomType, { color: theme.textPrimary }]}>{type}</Text>
                      <View
                        style={[styles.barreType, { backgroundColor: theme.backgroundPrimary }]}
                      >
                        <View
                          style={[
                            styles.remplissageType,
                            {
                              width: `${(count / stats.totalTaches) * 100}%`,
                              backgroundColor: theme.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.nombreType, { color: theme.textSecondary }]}>
                        {count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sprints */}
              {stats.sprints.length > 0 && (
                <View
                  style={[
                    styles.carte,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>Sprints</Text>
                  {stats.sprints.map((sprint) => (
                    <TouchableOpacity
                      key={sprint.id}
                      style={[
                        styles.ligneSprint,
                        { borderColor: theme.border },
                        sprintSelectionne === sprint.id && {
                          backgroundColor: theme.primary + "15",
                        },
                      ]}
                      onPress={() =>
                        setSprintSelectionne(sprint.id === sprintSelectionne ? null : sprint.id)
                      }
                    >
                      <View style={styles.infosSprint}>
                        <Text style={[styles.nomSprint, { color: theme.textPrimary }]}>
                          {sprint.name}
                        </Text>
                        <View
                          style={[
                            styles.badgeStatut,
                            {
                              backgroundColor: SPRINT_STATUS_COLORS[sprint.status] + "20",
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
                      <View style={styles.progressionSprint}>
                        <View
                          style={[styles.barreProg, { backgroundColor: theme.backgroundPrimary }]}
                        >
                          <View
                            style={[
                              styles.remplissageProg,
                              {
                                width: `${sprint.progression}%`,
                                backgroundColor: SPRINT_STATUS_COLORS[sprint.status],
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.texteProg, { color: theme.textSecondary }]}>
                          {sprint.tasksDone}/{sprint.tasksTotal} — {sprint.progression}%
                        </Text>
                      </View>
                      <Text style={[styles.voirBurndown, { color: theme.primary }]}>
                        {sprintSelectionne === sprint.id ? "▲ Masquer" : "📊 Burndown"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Burndown chart */}
              {sprintSelectionne && (
                <View
                  style={[
                    styles.carte,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {chargementBurndown ? (
                    <ActivityIndicator size="large" color={theme.primary} />
                  ) : (
                    burndown && (
                      <>
                        <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                          Burndown — {burndown.sprint.name}
                        </Text>

                        {burndown.donneesReelles.length === 0 ? (
                          <View style={styles.videChart}>
                            <Text style={[styles.texteVideChart, { color: theme.textSecondary }]}>
                              Pas encore de données.{"\n"}Le graphique se remplit chaque nuit
                              automatiquement.
                            </Text>
                          </View>
                        ) : (
                          <>
                            {/* Légende */}
                            <View style={styles.legende}>
                              <View style={styles.elementLegende}>
                                <View
                                  style={[styles.ligneLegende, { backgroundColor: theme.primary }]}
                                />
                                <Text style={[styles.texteLegende, { color: theme.textSecondary }]}>
                                  Réel
                                </Text>
                              </View>
                              <View style={styles.elementLegende}>
                                <View
                                  style={[
                                    styles.ligneLegende,
                                    {
                                      backgroundColor: "#888",
                                      borderStyle: "dashed",
                                    },
                                  ]}
                                />
                                <Text style={[styles.texteLegende, { color: theme.textSecondary }]}>
                                  Idéal
                                </Text>
                              </View>
                            </View>

                            {/* Graphique SVG */}
                            <Svg width={largeurGraphique} height={hauteurGraphique}>
                              {/* Axe Y */}
                              <Line
                                x1={paddingGauche}
                                y1={paddingHaut}
                                x2={paddingGauche}
                                y2={hauteurGraphique - paddingBas}
                                stroke={theme.border}
                                strokeWidth={1}
                              />
                              {/* Axe X */}
                              <Line
                                x1={paddingGauche}
                                y1={hauteurGraphique - paddingBas}
                                x2={largeurGraphique - 10}
                                y2={hauteurGraphique - paddingBas}
                                stroke={theme.border}
                                strokeWidth={1}
                              />

                              {/* Labels axe Y */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                const y = paddingHaut + ratio * hauteurZone;
                                const valeur = Math.round(burndown.sprint.tasksTotal * (1 - ratio));
                                return (
                                  <SvgText
                                    key={ratio}
                                    x={paddingGauche - 4}
                                    y={y + 4}
                                    fontSize={9}
                                    fill={theme.textSecondary}
                                    textAnchor="end"
                                  >
                                    {valeur}
                                  </SvgText>
                                );
                              })}

                              {/* Ligne idéale (pointillés) */}
                              {burndown.ligneIdeale.length > 0 && (
                                <Path
                                  d={genererChemin(
                                    burndown.ligneIdeale,
                                    burndown.sprint.tasksTotal
                                  )}
                                  stroke="#888"
                                  strokeWidth={1.5}
                                  strokeDasharray="5,4"
                                  fill="none"
                                />
                              )}

                              {/* Ligne réelle */}
                              {burndown.donneesReelles.length > 0 && (
                                <>
                                  <Path
                                    d={genererChemin(
                                      burndown.donneesReelles,
                                      burndown.sprint.tasksTotal
                                    )}
                                    stroke={theme.primary}
                                    strokeWidth={2.5}
                                    fill="none"
                                  />
                                  {/* Points sur la ligne réelle */}
                                  {burndown.donneesReelles.map((d, i) => {
                                    const x =
                                      paddingGauche +
                                      (i / Math.max(burndown.donneesReelles.length - 1, 1)) *
                                        largeurZone;
                                    const y =
                                      paddingHaut +
                                      ((burndown.sprint.tasksTotal - d.tasksRemaining) /
                                        Math.max(burndown.sprint.tasksTotal, 1)) *
                                        hauteurZone;
                                    return (
                                      <Circle key={i} cx={x} cy={y} r={4} fill={theme.primary} />
                                    );
                                  })}
                                </>
                              )}

                              {/* Labels axe X */}
                              {burndown.donneesReelles.map((d, i) => {
                                if (
                                  i % Math.ceil(burndown.donneesReelles.length / 5) !== 0 &&
                                  i !== burndown.donneesReelles.length - 1
                                )
                                  return null;
                                const x =
                                  paddingGauche +
                                  (i / Math.max(burndown.donneesReelles.length - 1, 1)) *
                                    largeurZone;
                                return (
                                  <SvgText
                                    key={i}
                                    x={x}
                                    y={hauteurGraphique - 8}
                                    fontSize={9}
                                    fill={theme.textSecondary}
                                    textAnchor="middle"
                                  >
                                    {formaterDate(d.date)}
                                  </SvgText>
                                );
                              })}
                            </Svg>

                            {/* Stats du sprint */}
                            <View style={styles.statsSprint}>
                              <Text
                                style={[styles.statSprintTexte, { color: theme.textSecondary }]}
                              >
                                {burndown.sprint.tasksDone} tâches terminées sur{" "}
                                {burndown.sprint.tasksTotal} — {burndown.sprint.progression}%
                              </Text>
                            </View>
                          </>
                        )}
                      </>
                    )
                  )}
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contenu: { padding: 16, gap: 16 },
  contenuTablette: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    padding: 24,
  },
  boutonRetour: { padding: 4 },
  texteBoutonRetour: { fontSize: 15 },
  titre: { fontSize: 22, fontWeight: "700" },
  sections: { gap: 16 },
  carte: { borderRadius: 12, borderWidth: 0.5, padding: 14, gap: 12 },
  titreCarte: { fontSize: 16, fontWeight: "600" },
  grilleStats: { flexDirection: "row", gap: 8 },
  statItem: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statNombre: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  ligneType: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconeType: { fontSize: 14, width: 20 },
  nomType: { fontSize: 13, width: 50 },
  barreType: { flex: 1, height: 6, borderRadius: 3 },
  remplissageType: { height: 6, borderRadius: 3 },
  nombreType: { fontSize: 12, width: 24, textAlign: "right" },
  ligneSprint: { borderRadius: 8, borderWidth: 0.5, padding: 10, gap: 6 },
  infosSprint: { flexDirection: "row", alignItems: "center", gap: 8 },
  nomSprint: { fontSize: 14, fontWeight: "600", flex: 1 },
  badgeStatut: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  texteStatut: { fontSize: 11, fontWeight: "600" },
  progressionSprint: { gap: 4 },
  barreProg: { height: 4, borderRadius: 2 },
  remplissageProg: { height: 4, borderRadius: 2 },
  texteProg: { fontSize: 11 },
  voirBurndown: { fontSize: 13, fontWeight: "500", textAlign: "right" },
  legende: { flexDirection: "row", gap: 16 },
  elementLegende: { flexDirection: "row", alignItems: "center", gap: 6 },
  ligneLegende: { width: 24, height: 2 },
  texteLegende: { fontSize: 12 },
  videChart: { padding: 20, alignItems: "center" },
  texteVideChart: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  statsSprint: { alignItems: "center" },
  statSprintTexte: { fontSize: 12 },
});
