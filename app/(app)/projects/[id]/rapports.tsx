// =====================================================
// rapports.tsx — Rapports avancés d'un projet
// Affiche : vélocité, temps passé, comparatif sprints
// et export CSV depuis l'app mobile
// =====================================================
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";

// =====================
// TYPES
// =====================

interface DonneesVelocite {
  projetId: number;
  projetNom: string;
  sprints: SprintVelocite[];
  velociteMoyenne: number;
  totalSprints: number;
}

interface SprintVelocite {
  sprintId: number;
  sprintNom: string;
  statut: string;
  dateDebut: string | null;
  dateFin: string | null;
  totalTaches: number;
  tachesTerminees: number;
  velocite: number;
  tauxCompletion: number;
}

interface DonneesTemps {
  projetId: number;
  projetNom: string;
  totalHeures: number;
  parMembre: MembreTemps[];
  parTache: TacheTemps[];
}

interface MembreTemps {
  membreId: number;
  heuresEstimees: number;
  totalTaches: number;
  tachesTerminees: number;
  tauxCompletion: number;
}

interface TacheTemps {
  tacheId: number;
  tacheNom: string;
  heuresEstimees: number;
  priorite: string;
  statut: string;
}

interface DonneesMultiSprint {
  projetId: number;
  projetNom: string;
  sprints: SprintComparatif[];
  totalSprints: number;
}

interface SprintComparatif {
  sprintId: number;
  sprintNom: string;
  statut: string;
  totalTaches: number;
  tachesTerminees: number;
  tachesEnCours: number;
  tachesAFaire: number;
  tauxCompletion: number;
  tempsEstime: number;
}

// =====================
// COMPOSANT GRAPHIQUE BARRE SVG
// Affiche un graphique en barres simple avec SVG natif
// Compatible iOS et Android sans dépendances externes
// =====================
function GraphiqueBarre({
  données,
  cléValeur,
  couleur,
  hauteur = 160,
  theme,
}: {
  données: any[];
  cléValeur: string;
  couleur: string;
  hauteur?: number;
  theme: any;
}) {
  const largeur = Dimensions.get("window").width - 64;
  const maxVal = Math.max(...données.map((d) => d[cléValeur] || 0), 1);
  const largBarre = (largeur - 40) / données.length - 8;

  return (
    <Svg width={largeur} height={hauteur + 30}>
      {données.map((item, index) => {
        const hauteurBarre = ((item[cléValeur] || 0) / maxVal) * hauteur;
        const x = 40 + index * ((largeur - 40) / données.length);
        const y = hauteur - hauteurBarre;

        return (
          <React.Fragment key={index}>
            {/* Barre */}
            <Rect
              x={x}
              y={y}
              width={Math.max(largBarre, 8)}
              height={Math.max(hauteurBarre, 2)}
              fill={couleur}
              rx={4}
            />
            {/* Valeur au-dessus de la barre */}
            <SvgText
              x={x + largBarre / 2}
              y={y - 4}
              fontSize={10}
              fill={theme.textSecondary}
              textAnchor="middle"
            >
              {item[cléValeur] || 0}
            </SvgText>
            {/* Label en bas */}
            <SvgText
              x={x + largBarre / 2}
              y={hauteur + 20}
              fontSize={9}
              fill={theme.textSecondary}
              textAnchor="middle"
            >
              {(item.sprintNom || item.tacheNom || "").slice(0, 8)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {/* Ligne de base */}
      <Line
        x1={40}
        y1={hauteur}
        x2={largeur}
        y2={hauteur}
        stroke={theme.border}
        strokeWidth={1}
      />
    </Svg>
  );
}

// =====================
// COMPOSANT PRINCIPAL
// =====================
export default function RapportsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projetId = parseInt(id);
  const router = useRouter();
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();

  // Onglet actif — velocite | temps | multi
  const [ongletActif, setOngletActif] = useState<
    "velocite" | "temps" | "multi"
  >("velocite");

  // =====================
  // CHARGEMENT VÉLOCITÉ
  // =====================
  const {
    data: donneesVelocite,
    isLoading: chargementVelocite,
    refetch: rechargerVelocite,
    isRefetching: rechargementVelocite,
  } = useQuery<DonneesVelocite>({
    queryKey: ["rapports-velocite", projetId],
    queryFn: async () => {
      console.log("=== APPEL API velocity ===", projetId);
      try {
        const reponse = await apiClient.get(
          `/reports/project/${projetId}/velocity`,
        );
        console.log("=== REPONSE velocity ===", JSON.stringify(reponse.data));
        return reponse.data;
      } catch (err: any) {
        console.log(
          "=== ERREUR velocity ===",
          err?.message,
          err?.response?.status,
          JSON.stringify(err?.response?.data),
        );
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  // =====================
  // CHARGEMENT TEMPS PASSÉ
  // =====================
  const {
    data: donneesTemps,
    isLoading: chargementTemps,
    refetch: rechargerTemps,
    isRefetching: rechargementTemps,
  } = useQuery<DonneesTemps>({
    queryKey: ["rapports-temps", projetId],
    queryFn: async () => {
      console.log("=== APPEL API time-spent ===", projetId);
      try {
        const reponse = await apiClient.get(
          `/reports/project/${projetId}/time-spent`,
        );
        console.log("=== REPONSE time-spent ===", JSON.stringify(reponse.data));
        return reponse.data;
      } catch (err: any) {
        console.log(
          "=== ERREUR time-spent ===",
          err?.message,
          err?.response?.status,
          JSON.stringify(err?.response?.data),
        );
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  // =====================
  // CHARGEMENT MULTI-SPRINT
  // =====================
  const {
    data: donneesMulti,
    isLoading: chargementMulti,
    refetch: rechargerMulti,
    isRefetching: rechargementMulti,
  } = useQuery<DonneesMultiSprint>({
    queryKey: ["rapports-multi", projetId],
    queryFn: async () => {
      console.log("=== APPEL API multi-sprint ===", projetId);
      try {
        const reponse = await apiClient.get(
          `/reports/project/${projetId}/multi-sprint`,
        );
        console.log(
          "=== REPONSE multi-sprint ===",
          JSON.stringify(reponse.data),
        );
        return reponse.data;
      } catch (err: any) {
        console.log(
          "=== ERREUR multi-sprint ===",
          err?.message,
          err?.response?.status,
          JSON.stringify(err?.response?.data),
        );
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  // =====================
  // LOGS DEBUG — à supprimer après vérification
  // =====================
  console.log("=== RAPPORTS DEBUG ===");
  console.log("projetId:", projetId);
  console.log("chargementVelocite:", chargementVelocite);
  console.log("donneesVelocite:", JSON.stringify(donneesVelocite));
  console.log("chargementTemps:", chargementTemps);
  console.log("donneesTemps:", JSON.stringify(donneesTemps));
  console.log("chargementMulti:", chargementMulti);
  console.log("donneesMulti:", JSON.stringify(donneesMulti));

  // =====================
  // FONCTIONS
  // =====================

  // Détermine si un chargement est en cours selon l'onglet
  const estEnChargement =
    (ongletActif === "velocite" && chargementVelocite) ||
    (ongletActif === "temps" && chargementTemps) ||
    (ongletActif === "multi" && chargementMulti);

  // Recharge selon l'onglet actif
  function recharger() {
    if (ongletActif === "velocite") rechargerVelocite();
    if (ongletActif === "temps") rechargerTemps();
    if (ongletActif === "multi") rechargerMulti();
  }

  // Partage le lien CSV via le système de partage natif iOS/Android
  async function partagerCsv() {
    try {
      await Share.share({
        message: `Rapport CSV du projet — téléchargeable sur : ${apiClient.defaults.baseURL}/reports/project/${projetId}/export-csv`,
        title: "Export CSV Project Manager",
      });
    } catch (err) {
      console.error("Erreur partage CSV :", err);
    }
  }

  // Couleur du badge statut sprint
  function couleurStatut(statut: string): { bg: string; text: string } {
    switch (statut) {
      case "completed":
        return { bg: "#EAF3DE", text: "#3B6D11" };
      case "active":
        return { bg: "#E6F1FB", text: "#185FA5" };
      default:
        return { bg: "#F0F0F0", text: "#888" };
    }
  }

  // =====================
  // RENDU
  // =====================
  return (
    <SafeAreaView
      style={[styles.conteneur, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* ---- EN-TÊTE ---- */}
      <View style={[styles.entete, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.boutonRetour}
        >
          <Text style={{ color: theme.primary, fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.titre, { color: theme.textPrimary }]}>
          Rapports
        </Text>
        {/* Bouton export CSV via partage natif */}
        <TouchableOpacity
          onPress={partagerCsv}
          style={[styles.boutonCsv, { backgroundColor: "#639922" }]}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
            ⬇️ CSV
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---- ONGLETS ---- */}
      <View style={[styles.onglets, { borderBottomColor: theme.border }]}>
        {(["velocite", "temps", "multi"] as const).map((onglet) => (
          <TouchableOpacity
            key={onglet}
            onPress={() => setOngletActif(onglet)}
            style={[
              styles.onglet,
              ongletActif === onglet && {
                borderBottomColor: theme.primary,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.texteOnglet,
                {
                  color:
                    ongletActif === onglet
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              {onglet === "velocite"
                ? "📈 Vélocité"
                : onglet === "temps"
                  ? "⏱️ Temps"
                  : "📊 Sprints"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenu,
          isTablet && styles.contenuTablette,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={
              rechargementVelocite || rechargementTemps || rechargementMulti
            }
            onRefresh={recharger}
          />
        }
      >
        {/* ---- CHARGEMENT ---- */}
        {estEnChargement && (
          <View style={styles.centre}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* ════════════════════════════════════
            ONGLET VÉLOCITÉ
        ════════════════════════════════════ */}
        {ongletActif === "velocite" &&
          donneesVelocite &&
          !chargementVelocite && (
            <View style={{ gap: 12 }}>
              {/* Cartes résumé */}
              <View style={styles.grilleStats}>
                <View
                  style={[
                    styles.carteStatut,
                    {
                      backgroundColor: theme.backgroundPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.chiffreStatut, { color: theme.primary }]}
                  >
                    {donneesVelocite.velociteMoyenne}
                  </Text>
                  <Text
                    style={[styles.labelStatut, { color: theme.textSecondary }]}
                  >
                    Vélocité moyenne
                  </Text>
                </View>
                <View
                  style={[
                    styles.carteStatut,
                    {
                      backgroundColor: theme.backgroundPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.chiffreStatut, { color: "#639922" }]}>
                    {donneesVelocite.totalSprints}
                  </Text>
                  <Text
                    style={[styles.labelStatut, { color: theme.textSecondary }]}
                  >
                    Total sprints
                  </Text>
                </View>
              </View>

              {/* Graphique vélocité */}
              {donneesVelocite.sprints.length > 0 && (
                <View
                  style={[
                    styles.carte,
                    {
                      backgroundColor: theme.backgroundPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.titreCarte, { color: theme.textPrimary }]}
                  >
                    Tâches terminées par sprint
                  </Text>
                  <GraphiqueBarre
                    données={donneesVelocite.sprints}
                    cléValeur="tachesTerminees"
                    couleur={theme.primary}
                    theme={theme}
                  />
                </View>
              )}

              {/* Liste des sprints */}
              <View
                style={[
                  styles.carte,
                  {
                    backgroundColor: theme.backgroundPrimary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                  Détail par sprint
                </Text>
                {donneesVelocite.sprints.length === 0 ? (
                  <Text
                    style={[styles.texteVide, { color: theme.textSecondary }]}
                  >
                    Aucun sprint pour ce projet
                  </Text>
                ) : (
                  donneesVelocite.sprints.map((sprint) => (
                    <View
                      key={sprint.sprintId}
                      style={[
                        styles.ligneSprint,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.nomSprint,
                            { color: theme.textPrimary },
                          ]}
                        >
                          {sprint.sprintNom}
                        </Text>
                        {sprint.dateDebut && (
                          <Text
                            style={[
                              styles.dateSprint,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {sprint.dateDebut} → {sprint.dateFin}
                          </Text>
                        )}
                      </View>
                      <View style={styles.statsSprintDroite}>
                        <Text
                          style={[
                            styles.chiffreSprint,
                            { color: theme.primary },
                          ]}
                        >
                          {sprint.tachesTerminees}
                        </Text>
                        <Text
                          style={[
                            styles.labelChiffreSprint,
                            { color: theme.textSecondary },
                          ]}
                        >
                          terminées
                        </Text>
                      </View>
                      <View style={styles.statsSprintDroite}>
                        <Text
                          style={[styles.chiffreSprint, { color: "#639922" }]}
                        >
                          {sprint.tauxCompletion}%
                        </Text>
                        <Text
                          style={[
                            styles.labelChiffreSprint,
                            { color: theme.textSecondary },
                          ]}
                        >
                          complétion
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.badgeStatut,
                          { backgroundColor: couleurStatut(sprint.statut).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.texteStatut,
                            { color: couleurStatut(sprint.statut).text },
                          ]}
                        >
                          {sprint.statut}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

        {/* ════════════════════════════════════
            ONGLET TEMPS PASSÉ
        ════════════════════════════════════ */}
        {ongletActif === "temps" && donneesTemps && !chargementTemps && (
          <View style={{ gap: 12 }}>
            {/* Total heures */}
            <View
              style={[
                styles.carte,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                  alignItems: "center",
                },
              ]}
            >
              <Text style={[styles.chiffreGrand, { color: theme.primary }]}>
                {donneesTemps.totalHeures}h
              </Text>
              <Text
                style={[styles.labelStatut, { color: theme.textSecondary }]}
              >
                Temps total estimé · {donneesTemps.parTache.length} tâches
              </Text>
            </View>

            {/* Graphique temps par tâche */}
            {donneesTemps.parTache.length > 0 && (
              <View
                style={[
                  styles.carte,
                  {
                    backgroundColor: theme.backgroundPrimary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                  Top tâches par temps estimé
                </Text>
                <GraphiqueBarre
                  données={donneesTemps.parTache.slice(0, 8)}
                  cléValeur="heuresEstimees"
                  couleur="#378ADD"
                  theme={theme}
                />
              </View>
            )}

            {/* Liste tâches */}
            <View
              style={[
                styles.carte,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                Toutes les tâches
              </Text>
              {donneesTemps.parTache.length === 0 ? (
                <Text
                  style={[styles.texteVide, { color: theme.textSecondary }]}
                >
                  Aucune tâche avec temps estimé
                </Text>
              ) : (
                donneesTemps.parTache.map((tache) => (
                  <View
                    key={tache.tacheId}
                    style={[
                      styles.ligneTache,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.nomTache, { color: theme.textPrimary }]}
                      >
                        {tache.tacheNom}
                      </Text>
                      <Text
                        style={[
                          styles.metaTache,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {tache.priorite} · {tache.statut}
                      </Text>
                    </View>
                    <Text
                      style={[styles.heuresTache, { color: theme.primary }]}
                    >
                      {tache.heuresEstimees}h
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ════════════════════════════════════
            ONGLET MULTI-SPRINTS
        ════════════════════════════════════ */}
        {ongletActif === "multi" && donneesMulti && !chargementMulti && (
          <View style={{ gap: 12 }}>
            {/* Graphique comparatif */}
            {donneesMulti.sprints.length > 0 && (
              <View
                style={[
                  styles.carte,
                  {
                    backgroundColor: theme.backgroundPrimary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                  Tâches terminées par sprint
                </Text>
                <GraphiqueBarre
                  données={donneesMulti.sprints}
                  cléValeur="tachesTerminees"
                  couleur="#639922"
                  theme={theme}
                />
              </View>
            )}

            {/* Tableau comparatif */}
            <View
              style={[
                styles.carte,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                Comparatif détaillé
              </Text>

              {/* En-tête tableau */}
              <View
                style={[
                  styles.ligneTableau,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.celluleEntete,
                    { color: theme.textSecondary, flex: 2 },
                  ]}
                >
                  Sprint
                </Text>
                <Text style={[styles.celluleEntete, { color: "#639922" }]}>
                  ✅
                </Text>
                <Text style={[styles.celluleEntete, { color: "#378ADD" }]}>
                  🔵
                </Text>
                <Text
                  style={[styles.celluleEntete, { color: theme.textSecondary }]}
                >
                  ⬜
                </Text>
                <Text
                  style={[styles.celluleEntete, { color: theme.textPrimary }]}
                >
                  %
                </Text>
              </View>

              {donneesMulti.sprints.length === 0 ? (
                <Text
                  style={[styles.texteVide, { color: theme.textSecondary }]}
                >
                  Aucun sprint disponible
                </Text>
              ) : (
                donneesMulti.sprints.map((sprint) => (
                  <View
                    key={sprint.sprintId}
                    style={[
                      styles.ligneTableau,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellule,
                        { color: theme.textPrimary, flex: 2 },
                      ]}
                      numberOfLines={1}
                    >
                      {sprint.sprintNom}
                    </Text>
                    <Text
                      style={[
                        styles.cellule,
                        { color: "#639922", fontWeight: "700" },
                      ]}
                    >
                      {sprint.tachesTerminees}
                    </Text>
                    <Text
                      style={[
                        styles.cellule,
                        { color: "#378ADD", fontWeight: "700" },
                      ]}
                    >
                      {sprint.tachesEnCours}
                    </Text>
                    <Text
                      style={[
                        styles.cellule,
                        { color: theme.textSecondary, fontWeight: "700" },
                      ]}
                    >
                      {sprint.tachesAFaire}
                    </Text>
                    <View
                      style={[
                        styles.badgePourcentage,
                        {
                          backgroundColor:
                            sprint.tauxCompletion >= 75
                              ? "#EAF3DE"
                              : sprint.tauxCompletion >= 50
                                ? "#E6F1FB"
                                : "#FEF2F2",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color:
                            sprint.tauxCompletion >= 75
                              ? "#3B6D11"
                              : sprint.tauxCompletion >= 50
                                ? "#185FA5"
                                : "#B91C1C",
                        }}
                      >
                        {sprint.tauxCompletion}%
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  entete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  boutonRetour: { paddingVertical: 4, paddingHorizontal: 8 },
  titre: { fontSize: 16, fontWeight: "600" },
  boutonCsv: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  onglets: { flexDirection: "row", borderBottomWidth: 1 },
  onglet: { flex: 1, paddingVertical: 12, alignItems: "center" },
  texteOnglet: { fontSize: 13, fontWeight: "500" },
  contenu: { padding: 16, gap: 12 },
  contenuTablette: { maxWidth: 700, alignSelf: "center", width: "100%" },
  centre: { padding: 40, alignItems: "center" },
  grilleStats: { flexDirection: "row", gap: 12 },
  carteStatut: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  chiffreStatut: { fontSize: 28, fontWeight: "700" },
  chiffreGrand: { fontSize: 40, fontWeight: "700" },
  labelStatut: { fontSize: 11, marginTop: 4, textAlign: "center" },
  carte: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 8 },
  titreCarte: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  texteVide: { fontSize: 13, textAlign: "center", paddingVertical: 20 },
  ligneSprint: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  nomSprint: { fontSize: 13, fontWeight: "500" },
  dateSprint: { fontSize: 11, marginTop: 2 },
  statsSprintDroite: { alignItems: "center", minWidth: 50 },
  chiffreSprint: { fontSize: 16, fontWeight: "700" },
  labelChiffreSprint: { fontSize: 9 },
  badgeStatut: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  texteStatut: { fontSize: 10, fontWeight: "600" },
  ligneTache: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  nomTache: { fontSize: 13, fontWeight: "500" },
  metaTache: { fontSize: 11, marginTop: 2 },
  heuresTache: { fontSize: 16, fontWeight: "700" },
  ligneTableau: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    gap: 4,
  },
  ligneEntete: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 4,
  },
  celluleEntete: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  cellule: { flex: 1, fontSize: 12, textAlign: "center" },
  badgePourcentage: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 3,
    borderRadius: 20,
  },
});
