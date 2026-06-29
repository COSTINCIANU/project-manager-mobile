// =====================================================
// SearchScreen — Recherche avancée
// Cherche dans les projets et tâches simultanément
// Filtres : terme, type, priorité, statut, projet, date
// =====================================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Colors } from "@/constants/colors";

// =====================
// TYPES
// =====================

interface ResultatProjet {
  id: number;
  name: string;
  description: string | null;
  status: string;
  color: string;
  progress: number;
  type: "project";
}

interface ResultatTache {
  id: number;
  name: string;
  description: string | null;
  priority: string;
  ticketType: string;
  done: boolean;
  inProgress: boolean;
  projectId: number;
  assignedTo: number | null;
  sprintId: number | null;
  dueDate: string | null;
  type: "task";
}

interface ResultatsRecherche {
  projects: ResultatProjet[];
  tasks: ResultatTache[];
  total: number;
}

// =====================
// CONSTANTES
// =====================

// Icônes par type de ticket
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
  basse: Colors.priorityLow,
};

// Options des filtres
const FILTRES_TYPE = [
  { value: "", label: "Tous" },
  { value: "task", label: "✅ Tâche" },
  { value: "bug", label: "🐛 Bug" },
  { value: "story", label: "📖 Story" },
  { value: "epic", label: "⚡ Épic" },
];

const FILTRES_PRIORITE = [
  { value: "", label: "Toutes" },
  { value: "critique", label: "🔴 Critique" },
  { value: "haute", label: "🟠 Haute" },
  { value: "normale", label: "🟡 Normale" },
  { value: "basse", label: "🟢 Basse" },
];

const FILTRES_STATUT = [
  { value: "", label: "Tous" },
  { value: "todo", label: "⏳ À faire" },
  { value: "in_progress", label: "🔄 En cours" },
  { value: "done", label: "✅ Terminé" },
];

// =====================
// COMPOSANT PRINCIPAL
// =====================
export default function SearchScreen() {
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const router = useRouter();

  // =====================
  // ÉTATS DES FILTRES
  // =====================

  // Terme de recherche saisi
  const [terme, setTerme] = useState("");

  // Terme actif — déclenche la requête
  const [termeActif, setTermeActif] = useState("");

  // Filtre par type de ticket
  const [filtreType, setFiltreType] = useState("");

  // Filtre par priorité
  const [filtrePriorite, setFiltrePriorite] = useState("");

  // Filtre par statut
  const [filtreStatut, setFiltreStatut] = useState("");

  // Filtre par projet — identifiant numérique
  const [filtreProjetId, setFiltreProjetId] = useState("");

  // Filtre par date de début
  const [filtreDateDebut, setFiltreDateDebut] = useState("");

  // Filtre par date de fin
  const [filtreDateFin, setFiltreDateFin] = useState("");

  // Afficher ou masquer le panneau de filtres
  const [afficherFiltres, setAfficherFiltres] = useState(false);

  // =====================
  // CHARGEMENT DES PROJETS
  // Pour le sélecteur de projet dans les filtres
  // =====================
  const { data: projets = [] } = useQuery<ResultatProjet[]>({
    queryKey: ["projets-recherche"],
    queryFn: async () => {
      const { data } = await apiClient.get("/projects");
      return data;
    },
  });

  // =====================
  // REQUÊTE DE RECHERCHE
  // Se déclenche quand un filtre change
  // =====================
  const { data: resultats, isLoading } = useQuery<ResultatsRecherche>({
    queryKey: [
      "search",
      termeActif,
      filtreType,
      filtrePriorite,
      filtreStatut,
      filtreProjetId,
      filtreDateDebut,
      filtreDateFin,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (termeActif) params.append("q", termeActif);
      if (filtreType) params.append("type", filtreType);
      if (filtrePriorite) params.append("priority", filtrePriorite);
      if (filtreStatut) params.append("status", filtreStatut);
      if (filtreProjetId) params.append("project_id", filtreProjetId);
      if (filtreDateDebut) params.append("date_from", filtreDateDebut);
      if (filtreDateFin) params.append("date_to", filtreDateFin);

      const { data } = await apiClient.get(`${API_ENDPOINTS.SEARCH}?${params.toString()}`);
      return data;
    },
    enabled: !!(
      termeActif ||
      filtreType ||
      filtrePriorite ||
      filtreStatut ||
      filtreProjetId ||
      filtreDateDebut ||
      filtreDateFin
    ),
  });

  // =====================
  // FONCTIONS
  // =====================

  // Lance la recherche avec le terme saisi
  function lancerRecherche() {
    setTermeActif(terme);
  }

  // Réinitialise tous les filtres et résultats
  function reinitialiser() {
    setTerme("");
    setTermeActif("");
    setFiltreType("");
    setFiltrePriorite("");
    setFiltreStatut("");
    setFiltreProjetId("");
    setFiltreDateDebut("");
    setFiltreDateFin("");
  }

  // Nombre de filtres actifs — affiche le badge sur le bouton
  const nombreFiltresActifs = [
    filtreType,
    filtrePriorite,
    filtreStatut,
    filtreProjetId,
    filtreDateDebut,
    filtreDateFin,
  ].filter(Boolean).length;

  // =====================
  // COMPOSANT FILTRE INLINE
  // Boutons de sélection horizontaux
  // =====================
  function FiltreBoutons({
    label,
    options,
    valeur,
    onChanger,
  }: {
    label: string;
    options: { value: string; label: string }[];
    valeur: string;
    onChanger: (v: string) => void;
  }) {
    return (
      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.rangeFiltres}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onChanger(opt.value)}
                style={[
                  styles.optionFiltre,
                  {
                    backgroundColor: valeur === opt.value ? theme.primary : theme.backgroundPrimary,
                    borderColor: valeur === opt.value ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.texteOptionFiltre,
                    {
                      color: valeur === opt.value ? "#fff" : theme.textSecondary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // =====================
  // RENDU
  // =====================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      <ScrollView
        contentContainerStyle={[styles.contenu, isTablet && styles.contenuTablette]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- TITRE ---- */}
        <Text style={[styles.titre, { color: theme.textPrimary }]}>🔍 Recherche avancée</Text>

        {/* ---- BARRE DE RECHERCHE ---- */}
        <View
          style={[
            styles.barreRecherche,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[styles.inputRecherche, { color: theme.textPrimary }]}
            placeholder="Chercher un projet, une tâche..."
            placeholderTextColor={theme.textSecondary}
            value={terme}
            onChangeText={setTerme}
            onSubmitEditing={lancerRecherche}
            returnKeyType="search"
            autoFocus
          />
          {terme.length > 0 && (
            <TouchableOpacity onPress={() => setTerme("")}>
              <Text style={[styles.boutonEffacer, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.boutonRechercher, { backgroundColor: theme.primary }]}
            onPress={lancerRecherche}
          >
            <Text style={styles.texteBoutonRechercher}>Chercher</Text>
          </TouchableOpacity>
        </View>

        {/* ---- BOUTON AFFICHER FILTRES ---- */}
        <TouchableOpacity
          style={[
            styles.boutonFiltres,
            {
              borderColor: theme.border,
              backgroundColor:
                nombreFiltresActifs > 0 ? theme.primary + "20" : theme.backgroundSecondary,
            },
          ]}
          onPress={() => setAfficherFiltres(!afficherFiltres)}
        >
          <Text
            style={[
              styles.texteBoutonFiltres,
              {
                color: nombreFiltresActifs > 0 ? theme.primary : theme.textSecondary,
              },
            ]}
          >
            ⚙️ Filtres {nombreFiltresActifs > 0 ? `(${nombreFiltresActifs})` : ""}
            {afficherFiltres ? " ▲" : " ▼"}
          </Text>
        </TouchableOpacity>

        {/* ---- PANNEAU DE FILTRES ---- */}
        {afficherFiltres && (
          <View
            style={[
              styles.panneauFiltres,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Filtre type de ticket */}
            <FiltreBoutons
              label="Type de ticket"
              options={FILTRES_TYPE}
              valeur={filtreType}
              onChanger={setFiltreType}
            />

            {/* Filtre priorité */}
            <FiltreBoutons
              label="Priorité"
              options={FILTRES_PRIORITE}
              valeur={filtrePriorite}
              onChanger={setFiltrePriorite}
            />

            {/* Filtre statut */}
            <FiltreBoutons
              label="Statut"
              options={FILTRES_STATUT}
              valeur={filtreStatut}
              onChanger={setFiltreStatut}
            />

            {/* Filtre projet — sélecteur inline */}
            <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>Projet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.rangeFiltres}>
                <TouchableOpacity
                  onPress={() => setFiltreProjetId("")}
                  style={[
                    styles.optionFiltre,
                    {
                      backgroundColor:
                        filtreProjetId === "" ? theme.primary : theme.backgroundPrimary,
                      borderColor: filtreProjetId === "" ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.texteOptionFiltre,
                      {
                        color: filtreProjetId === "" ? "#fff" : theme.textSecondary,
                      },
                    ]}
                  >
                    Tous
                  </Text>
                </TouchableOpacity>
                {projets.map((projet) => (
                  <TouchableOpacity
                    key={projet.id}
                    onPress={() => setFiltreProjetId(String(projet.id))}
                    style={[
                      styles.optionFiltre,
                      {
                        backgroundColor:
                          filtreProjetId === String(projet.id)
                            ? theme.primary
                            : theme.backgroundPrimary,
                        borderColor:
                          filtreProjetId === String(projet.id) ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.texteOptionFiltre,
                        {
                          color:
                            filtreProjetId === String(projet.id) ? "#fff" : theme.textSecondary,
                        },
                      ]}
                    >
                      {projet.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Filtre date début */}
            <View style={{ marginTop: 10, marginBottom: 4 }}>
              <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>
                Date d'échéance — du
              </Text>
              <TextInput
                value={filtreDateDebut}
                onChangeText={setFiltreDateDebut}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.inputDate,
                  {
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundPrimary,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Filtre date fin */}
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>
                Date d'échéance — au
              </Text>
              <TextInput
                value={filtreDateFin}
                onChangeText={setFiltreDateFin}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.inputDate,
                  {
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundPrimary,
                    borderColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* Bouton réinitialiser les filtres */}
            {nombreFiltresActifs > 0 && (
              <TouchableOpacity
                style={[styles.boutonReinit, { borderColor: theme.border }]}
                onPress={() => {
                  setFiltreType("");
                  setFiltrePriorite("");
                  setFiltreStatut("");
                  setFiltreProjetId("");
                  setFiltreDateDebut("");
                  setFiltreDateFin("");
                }}
              >
                <Text style={[styles.texteBoutonReinit, { color: theme.textSecondary }]}>
                  Réinitialiser les filtres
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ---- CHARGEMENT ---- */}
        {isLoading && (
          <View style={styles.centre}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* ---- RÉSULTATS ---- */}
        {resultats && !isLoading && (
          <View style={styles.resultats}>
            {/* Compteur */}
            <Text style={[styles.nombreResultats, { color: theme.textSecondary }]}>
              {resultats.total} résultat{resultats.total > 1 ? "s" : ""} trouvé
              {resultats.total > 1 ? "s" : ""}
            </Text>

            {/* Projets */}
            {resultats.projects.length > 0 && (
              <View style={styles.sectionResultats}>
                <Text style={[styles.titreSection, { color: theme.textPrimary }]}>
                  📁 Projets ({resultats.projects.length})
                </Text>
                {resultats.projects.map((projet) => (
                  <TouchableOpacity
                    key={projet.id}
                    style={[
                      styles.carteResultat,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                        borderLeftColor: projet.color,
                        borderLeftWidth: 4,
                      },
                    ]}
                    onPress={() => router.push(`/(app)/projects/${projet.id}` as any)}
                  >
                    <Text style={[styles.nomResultat, { color: theme.textPrimary }]}>
                      {projet.name}
                    </Text>
                    <View style={styles.piedResultat}>
                      <Text style={[styles.metaResultat, { color: theme.textSecondary }]}>
                        {projet.status} • {projet.progress}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Tâches */}
            {resultats.tasks.length > 0 && (
              <View style={styles.sectionResultats}>
                <Text style={[styles.titreSection, { color: theme.textPrimary }]}>
                  📋 Tâches ({resultats.tasks.length})
                </Text>
                {resultats.tasks.map((tache) => (
                  <TouchableOpacity
                    key={tache.id}
                    style={[
                      styles.carteResultat,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: theme.border,
                        borderLeftColor: PRIORITY_COLORS[tache.priority] ?? "#888",
                        borderLeftWidth: 4,
                      },
                    ]}
                    onPress={() => router.push(`/(app)/tasks/${tache.id}` as any)}
                  >
                    <View style={styles.enteteResultatTache}>
                      <Text style={styles.iconeTicket}>
                        {TICKET_ICONS[tache.ticketType] ?? "✅"}
                      </Text>
                      <Text style={[styles.nomResultat, { color: theme.textPrimary }]}>
                        {tache.name}
                      </Text>
                    </View>
                    {tache.description && (
                      <Text
                        style={[styles.descriptionResultat, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {tache.description}
                      </Text>
                    )}
                    <View style={styles.piedResultat}>
                      <View
                        style={[
                          styles.badgePriorite,
                          {
                            backgroundColor: (PRIORITY_COLORS[tache.priority] ?? "#888") + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.texteBadge,
                            {
                              color: PRIORITY_COLORS[tache.priority] ?? "#888",
                            },
                          ]}
                        >
                          {tache.priority}
                        </Text>
                      </View>
                      <Text style={[styles.metaResultat, { color: theme.textSecondary }]}>
                        {tache.done
                          ? "✅ Terminé"
                          : tache.inProgress
                            ? "🔄 En cours"
                            : "⏳ À faire"}
                      </Text>
                      {tache.dueDate && (
                        <Text style={[styles.metaResultat, { color: theme.textSecondary }]}>
                          📅 {new Date(tache.dueDate).toLocaleDateString("fr-FR")}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Aucun résultat */}
            {resultats.total === 0 && (
              <View style={styles.vide}>
                <Text style={[styles.texteVide, { color: theme.textSecondary }]}>
                  Aucun résultat pour ces critères
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ---- MESSAGE INITIAL ---- */}
        {!resultats && !isLoading && (
          <View style={styles.vide}>
            <Text style={[styles.texteVide, { color: theme.textSecondary }]}>
              Tapez un mot-clé ou sélectionnez{"\n"}un filtre pour lancer la recherche
            </Text>
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
  container: { flex: 1 },
  contenu: { padding: 16, gap: 16 },
  contenuTablette: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    padding: 24,
  },
  titre: { fontSize: 22, fontWeight: "700" },
  barreRecherche: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputRecherche: { flex: 1, paddingVertical: 12, fontSize: 15 },
  boutonEffacer: { fontSize: 16, padding: 4 },
  boutonRechercher: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  texteBoutonRechercher: { color: "#fff", fontSize: 13, fontWeight: "600" },
  boutonFiltres: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  texteBoutonFiltres: { fontSize: 14, fontWeight: "500" },
  panneauFiltres: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  labelFiltre: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  rangeFiltres: { flexDirection: "row", gap: 8 },
  optionFiltre: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  texteOptionFiltre: { fontSize: 12, fontWeight: "500" },
  inputDate: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    marginTop: 4,
  },
  boutonReinit: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 4,
  },
  texteBoutonReinit: { fontSize: 13 },
  centre: { padding: 40, alignItems: "center" },
  resultats: { gap: 16 },
  nombreResultats: { fontSize: 13 },
  sectionResultats: { gap: 8 },
  titreSection: { fontSize: 15, fontWeight: "600" },
  carteResultat: { borderRadius: 10, borderWidth: 0.5, padding: 12, gap: 6 },
  enteteResultatTache: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconeTicket: { fontSize: 14 },
  nomResultat: { fontSize: 14, fontWeight: "600", flex: 1 },
  descriptionResultat: { fontSize: 12 },
  piedResultat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badgePriorite: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  texteBadge: { fontSize: 11, fontWeight: "600" },
  metaResultat: { fontSize: 11 },
  vide: { padding: 40, alignItems: "center" },
  texteVide: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
