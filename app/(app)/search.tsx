// =====================================================
// SearchScreen — Recherche globale
// Cherche dans les projets et tâches simultanément
// Filtres : type de ticket, priorité, statut
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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Colors } from "@/constants/colors";

// Types des résultats
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
  dueDate: string | null;
  type: "task";
}

interface ResultatsRecherche {
  projects: ResultatProjet[];
  tasks: ResultatTache[];
  total: number;
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

// Filtres disponibles
const FILTRES_TYPE = [
  { value: "", label: "Tous" },
  { value: "task", label: "✅ Tâche" },
  { value: "bug", label: "🐛 Bug" },
  { value: "story", label: "📖 Story" },
  { value: "epic", label: "⚡ Épic" },
];

const FILTRES_PRIORITE = [
  { value: "", label: "Toutes" },
  { value: "critique", label: "Critique" },
  { value: "haute", label: "Haute" },
  { value: "normale", label: "Normale" },
  { value: "faible", label: "Faible" },
];

const FILTRES_STATUT = [
  { value: "", label: "Tous" },
  { value: "todo", label: "⏳ À faire" },
  { value: "in_progress", label: "🔄 En cours" },
  { value: "done", label: "✅ Terminé" },
];

export default function SearchScreen() {
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const router = useRouter();

  // États de recherche
  const [terme, setTerme] = useState("");
  const [termeActif, setTermeActif] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtrePriorite, setFiltrePriorite] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [afficherFiltres, setAfficherFiltres] = useState(false);

  // Requête de recherche — se déclenche quand termeActif ou filtres changent
  const { data: resultats, isLoading } = useQuery<ResultatsRecherche>({
    queryKey: ["search", termeActif, filtreType, filtrePriorite, filtreStatut],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (termeActif) params.append("q", termeActif);
      if (filtreType) params.append("type", filtreType);
      if (filtrePriorite) params.append("priority", filtrePriorite);
      if (filtreStatut) params.append("status", filtreStatut);

      const { data } = await apiClient.get(
        `${API_ENDPOINTS.SEARCH}?${params.toString()}`,
      );
      return data;
    },
    enabled: !!(termeActif || filtreType || filtrePriorite || filtreStatut),
  });

  // Lance la recherche
  const lancerRecherche = () => {
    setTermeActif(terme);
  };

  // Réinitialise tous les filtres
  const reinitialiser = () => {
    setTerme("");
    setTermeActif("");
    setFiltreType("");
    setFiltrePriorite("");
    setFiltreStatut("");
  };

  // Nombre de filtres actifs
  const nombreFiltresActifs = [filtreType, filtrePriorite, filtreStatut].filter(
    Boolean,
  ).length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.contenu,
          isTablet && styles.contenuTablette,
        ]}
      >
        {/* Titre */}
        <Text style={[styles.titre, { color: theme.textPrimary }]}>
          🔍 Recherche
        </Text>

        {/* Barre de recherche */}
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
            <TouchableOpacity onPress={reinitialiser}>
              <Text
                style={[styles.boutonEffacer, { color: theme.textSecondary }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.boutonRechercher,
              { backgroundColor: theme.primary },
            ]}
            onPress={lancerRecherche}
          >
            <Text style={styles.texteBoutonRechercher}>Chercher</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton filtres */}
        <TouchableOpacity
          style={[
            styles.boutonFiltres,
            {
              borderColor: theme.border,
              backgroundColor:
                nombreFiltresActifs > 0
                  ? theme.primary + "20"
                  : theme.backgroundSecondary,
            },
          ]}
          onPress={() => setAfficherFiltres(!afficherFiltres)}
        >
          <Text
            style={[
              styles.texteBoutonFiltres,
              {
                color:
                  nombreFiltresActifs > 0 ? theme.primary : theme.textSecondary,
              },
            ]}
          >
            ⚙️ Filtres{" "}
            {nombreFiltresActifs > 0 ? `(${nombreFiltresActifs})` : ""}
          </Text>
        </TouchableOpacity>

        {/* Panneau de filtres */}
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
            {/* Filtre type */}
            <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>
              Type de ticket
            </Text>
            <View style={styles.rangeFiltres}>
              {FILTRES_TYPE.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.optionFiltre,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundPrimary,
                    },
                    filtreType === f.value && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setFiltreType(f.value)}
                >
                  <Text
                    style={[
                      styles.texteOptionFiltre,
                      { color: theme.textSecondary },
                      filtreType === f.value && { color: "#fff" },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Filtre priorité */}
            <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>
              Priorité
            </Text>
            <View style={styles.rangeFiltres}>
              {FILTRES_PRIORITE.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.optionFiltre,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundPrimary,
                    },
                    filtrePriorite === f.value && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setFiltrePriorite(f.value)}
                >
                  <Text
                    style={[
                      styles.texteOptionFiltre,
                      { color: theme.textSecondary },
                      filtrePriorite === f.value && { color: "#fff" },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Filtre statut */}
            <Text style={[styles.labelFiltre, { color: theme.textPrimary }]}>
              Statut
            </Text>
            <View style={styles.rangeFiltres}>
              {FILTRES_STATUT.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.optionFiltre,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundPrimary,
                    },
                    filtreStatut === f.value && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setFiltreStatut(f.value)}
                >
                  <Text
                    style={[
                      styles.texteOptionFiltre,
                      { color: theme.textSecondary },
                      filtreStatut === f.value && { color: "#fff" },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bouton réinitialiser */}
            {nombreFiltresActifs > 0 && (
              <TouchableOpacity
                style={[styles.boutonReinit, { borderColor: theme.border }]}
                onPress={() => {
                  setFiltreType("");
                  setFiltrePriorite("");
                  setFiltreStatut("");
                }}
              >
                <Text
                  style={[
                    styles.texteBoutonReinit,
                    { color: theme.textSecondary },
                  ]}
                >
                  Réinitialiser les filtres
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Chargement */}
        {isLoading && (
          <View style={styles.centre}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* Résultats */}
        {resultats && !isLoading && (
          <View style={styles.resultats}>
            <Text
              style={[styles.nombreResultats, { color: theme.textSecondary }]}
            >
              {resultats.total} résultat{resultats.total > 1 ? "s" : ""} trouvé
              {resultats.total > 1 ? "s" : ""}
            </Text>

            {/* Résultats projets */}
            {resultats.projects.length > 0 && (
              <View style={styles.sectionResultats}>
                <Text
                  style={[styles.titreSection, { color: theme.textPrimary }]}
                >
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
                    onPress={() =>
                      router.push(`/(app)/projects/${projet.id}` as any)
                    }
                  >
                    <Text
                      style={[styles.nomResultat, { color: theme.textPrimary }]}
                    >
                      {projet.name}
                    </Text>
                    {projet.description && (
                      <Text
                        style={[
                          styles.descriptionResultat,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {projet.description}
                      </Text>
                    )}
                    <View style={styles.piedResultat}>
                      <Text
                        style={[
                          styles.metaResultat,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {projet.status} • {projet.progress}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Résultats tâches */}
            {resultats.tasks.length > 0 && (
              <View style={styles.sectionResultats}>
                <Text
                  style={[styles.titreSection, { color: theme.textPrimary }]}
                >
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
                        borderLeftColor:
                          PRIORITY_COLORS[tache.priority] ?? "#888",
                        borderLeftWidth: 4,
                      },
                    ]}
                    onPress={() =>
                      router.push(`/(app)/tasks/${tache.id}` as any)
                    }
                  >
                    <View style={styles.enteteResultatTache}>
                      <Text style={styles.iconeTicket}>
                        {TICKET_ICONS[tache.ticketType] ?? "✅"}
                      </Text>
                      <Text
                        style={[
                          styles.nomResultat,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {tache.name}
                      </Text>
                    </View>
                    {tache.description && (
                      <Text
                        style={[
                          styles.descriptionResultat,
                          { color: theme.textSecondary },
                        ]}
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
                            backgroundColor:
                              (PRIORITY_COLORS[tache.priority] ?? "#888") +
                              "20",
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
                      <Text
                        style={[
                          styles.metaResultat,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {tache.done
                          ? "✅ Terminé"
                          : tache.inProgress
                            ? "🔄 En cours"
                            : "⏳ À faire"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Aucun résultat */}
            {resultats.total === 0 && (
              <View style={styles.vide}>
                <Text
                  style={[styles.texteVide, { color: theme.textSecondary }]}
                >
                  Aucun résultat pour "{termeActif}"
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Message initial */}
        {!resultats && !isLoading && (
          <View style={styles.vide}>
            <Text style={[styles.texteVide, { color: theme.textSecondary }]}>
              Tapez un mot-clé pour chercher{"\n"}dans vos projets et tâches
            </Text>
          </View>
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
  panneauFiltres: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  labelFiltre: { fontSize: 13, fontWeight: "600" },
  rangeFiltres: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionFiltre: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  texteOptionFiltre: { fontSize: 12, fontWeight: "500" },
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
  piedResultat: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgePriorite: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  texteBadge: { fontSize: 11, fontWeight: "600" },
  metaResultat: { fontSize: 11 },
  vide: { padding: 40, alignItems: "center" },
  texteVide: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
