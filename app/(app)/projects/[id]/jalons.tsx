// =====================================================
// jalons.tsx — Écran des jalons d'un projet
// Affiche les jalons avec timeline, création,
// modification et suppression
// =====================================================
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// =====================
// TYPES
// =====================
interface Jalon {
  id: number;
  nom: string;
  description: string | null;
  date: string;
  projetId: number;
  atteint: boolean;
  couleur: string;
}

// =====================
// COMPOSANT PRINCIPAL
// =====================
export default function JalonsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projetId = parseInt(id);
  const router = useRouter();
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const queryClient = useQueryClient();

  // Formulaire création/édition
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [jalonEnEdition, setJalonEnEdition] = useState<Jalon | null>(null);
  const [formulaire, setFormulaire] = useState({
    nom: "",
    description: "",
    date: "",
    couleur: "#378ADD",
  });

  // =====================
  // CHARGEMENT DES JALONS
  // =====================
  const {
    data: jalons = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Jalon[]>({
    queryKey: ["jalons", projetId],
    queryFn: async () => {
      const reponse = await apiClient.get(`/api/projets/${projetId}/jalons`);
      return reponse.data;
    },
  });

  // =====================
  // CRÉER UN JALON
  // =====================
  const mutationCreer = useMutation({
    mutationFn: async (données: typeof formulaire) => {
      const reponse = await apiClient.post("/api/jalons", {
        ...données,
        projetId,
      });
      return reponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jalons", projetId] });
      reinitialiserFormulaire();
    },
  });

  // =====================
  // MODIFIER UN JALON
  // =====================
  const mutationModifier = useMutation({
    mutationFn: async ({ id, données }: { id: number; données: Partial<Jalon> }) => {
      const reponse = await apiClient.put(`/api/jalons/${id}`, données);
      return reponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jalons", projetId] });
      reinitialiserFormulaire();
    },
  });

  // =====================
  // SUPPRIMER UN JALON
  // =====================
  const mutationSupprimer = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/jalons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jalons", projetId] });
    },
  });

  // =====================
  // FONCTIONS
  // =====================
  function sauvegarderJalon() {
    if (!formulaire.nom || !formulaire.date) return;
    if (jalonEnEdition) {
      mutationModifier.mutate({ id: jalonEnEdition.id, données: formulaire });
    } else {
      mutationCreer.mutate(formulaire);
    }
  }

  function ouvrirEdition(jalon: Jalon) {
    setJalonEnEdition(jalon);
    setFormulaire({
      nom: jalon.nom,
      description: jalon.description || "",
      date: jalon.date,
      couleur: jalon.couleur,
    });
    setAfficherFormulaire(true);
  }

  function reinitialiserFormulaire() {
    setFormulaire({ nom: "", description: "", date: "", couleur: "#378ADD" });
    setJalonEnEdition(null);
    setAfficherFormulaire(false);
  }

  function toggleAtteint(jalon: Jalon) {
    mutationModifier.mutate({
      id: jalon.id,
      données: { atteint: !jalon.atteint },
    });
  }

  function estEnRetard(jalon: Jalon): boolean {
    return !jalon.atteint && new Date(jalon.date) < new Date();
  }

  function formaterDate(date: string): string {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // =====================
  // RENDU
  // =====================
  return (
    <SafeAreaView style={[styles.conteneur, { backgroundColor: theme.backgroundTertiary }]}>
      <View style={isTablet ? styles.wrapperTablette : styles.wrapperMobile}>
        {/* EN-TÊTE */}
        <View style={[styles.entete, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.boutonRetour}>
            <Text style={{ color: theme.primary, fontSize: 14 }}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.titre, { color: theme.textPrimary }]}>🏁 Jalons</Text>
          <TouchableOpacity
            onPress={() => setAfficherFormulaire(true)}
            style={[styles.boutonAjouter, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.contenu}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {/* FORMULAIRE */}
          {afficherFormulaire && (
            <View
              style={[
                styles.carte,
                { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.titreCarte, { color: theme.textPrimary }]}>
                {jalonEnEdition ? "Modifier le jalon" : "Nouveau jalon"}
              </Text>

              <Text style={[styles.label, { color: theme.textSecondary }]}>Nom *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                placeholder="ex: Livraison MVP"
                placeholderTextColor={theme.textSecondary}
                value={formulaire.nom}
                onChangeText={(v) => setFormulaire({ ...formulaire, nom: v })}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Date (AAAA-MM-JJ) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                placeholder="2026-07-15"
                placeholderTextColor={theme.textSecondary}
                value={formulaire.date}
                onChangeText={(v) => setFormulaire({ ...formulaire, date: v })}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                placeholder="Description optionnelle..."
                placeholderTextColor={theme.textSecondary}
                value={formulaire.description}
                onChangeText={(v) => setFormulaire({ ...formulaire, description: v })}
              />

              <View style={styles.boutonsCarte}>
                <TouchableOpacity
                  onPress={sauvegarderJalon}
                  style={[styles.boutonPrimaire, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                    {jalonEnEdition ? "Enregistrer" : "Créer"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={reinitialiserFormulaire}
                  style={[styles.boutonSecondaire, { borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* CHARGEMENT */}
          {isLoading && (
            <View style={styles.centre}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}

          {/* LISTE VIDE */}
          {!isLoading && jalons.length === 0 && (
            <View style={styles.centre}>
              <Text style={[styles.texteVide, { color: theme.textSecondary }]}>
                Aucun jalon — appuyez sur "+ Ajouter"
              </Text>
            </View>
          )}

          {/* LISTE DES JALONS */}
          {jalons.map((jalon) => (
            <View
              key={jalon.id}
              style={[
                styles.carteJalon,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: jalon.atteint ? "#639922" : jalon.couleur,
                },
              ]}
            >
              {/* Ligne indicateur couleur */}
              <View
                style={[
                  styles.ligneIndicateur,
                  { backgroundColor: jalon.atteint ? "#639922" : jalon.couleur },
                ]}
              />

              <View style={styles.contenuJalon}>
                {/* Nom et statut */}
                <View style={styles.ligneNom}>
                  <Text
                    style={[
                      styles.nomJalon,
                      {
                        color: jalon.atteint ? "#639922" : theme.textPrimary,
                        textDecorationLine: jalon.atteint ? "line-through" : "none",
                        flex: 1,
                      },
                    ]}
                  >
                    {jalon.atteint ? "✅ " : "🏁 "}
                    {jalon.nom}
                  </Text>
                  <View
                    style={[
                      styles.badgeStatut,
                      {
                        backgroundColor: jalon.atteint
                          ? "#EAF3DE"
                          : estEnRetard(jalon)
                            ? "#FCEBEB"
                            : "#F0F0F0",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: jalon.atteint ? "#3B6D11" : estEnRetard(jalon) ? "#A32D2D" : "#888",
                      }}
                    >
                      {jalon.atteint ? "Atteint" : estEnRetard(jalon) ? "En retard" : "En cours"}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <Text
                  style={[
                    styles.dateJalon,
                    {
                      color: estEnRetard(jalon) ? "#e74c3c" : theme.textSecondary,
                    },
                  ]}
                >
                  📅 {formaterDate(jalon.date)}
                  {estEnRetard(jalon) && " ⚠️"}
                </Text>

                {/* Description */}
                {jalon.description && (
                  <Text style={[styles.descriptionJalon, { color: theme.textSecondary }]}>
                    {jalon.description}
                  </Text>
                )}

                {/* Actions */}
                <View style={styles.actionsJalon}>
                  <TouchableOpacity
                    onPress={() => toggleAtteint(jalon)}
                    style={[
                      styles.boutonAction,
                      {
                        backgroundColor: jalon.atteint ? "#F0F0F0" : "#EAF3DE",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: jalon.atteint ? "#888" : "#3B6D11",
                        fontWeight: "600",
                      }}
                    >
                      {jalon.atteint ? "Marquer non atteint" : "✅ Marquer atteint"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => ouvrirEdition(jalon)}
                    style={[styles.boutonAction, { backgroundColor: "#E6F1FB" }]}
                  >
                    <Text style={{ fontSize: 11, color: "#185FA5", fontWeight: "600" }}>
                      ✎ Modifier
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => mutationSupprimer.mutate(jalon.id)}
                    style={[styles.boutonAction, { backgroundColor: "#FCEBEB" }]}
                  >
                    <Text style={{ fontSize: 11, color: "#A32D2D", fontWeight: "600" }}>
                      ✕ Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  wrapperMobile: { flex: 1 },
  wrapperTablette: { flex: 1, maxWidth: 860, alignSelf: "center", width: "100%" },
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
  boutonAjouter: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  contenu: { padding: 16, gap: 12 },
  carte: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 8 },
  titreCarte: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  label: { fontSize: 12, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  boutonsCarte: { flexDirection: "row", gap: 8, marginTop: 12 },
  boutonPrimaire: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center" },
  boutonSecondaire: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1 },
  centre: { padding: 40, alignItems: "center" },
  texteVide: { fontSize: 13, textAlign: "center" },
  carteJalon: { borderRadius: 12, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  ligneIndicateur: { width: 4 },
  contenuJalon: { flex: 1, padding: 12, gap: 6 },
  ligneNom: { flexDirection: "row", alignItems: "center", gap: 8 },
  nomJalon: { fontSize: 14, fontWeight: "600" },
  badgeStatut: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dateJalon: { fontSize: 12 },
  descriptionJalon: { fontSize: 12 },
  actionsJalon: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  boutonAction: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
});
