// =====================================================
// automatisations.tsx — Écran des règles automatiques
// Permet de créer des règles "Quand X → faire Y"
// sur un projet depuis l'app mobile
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

// Représente une règle d'automatisation
interface RegleAutomatisation {
  id: number;
  nom: string;
  declencheur: string;
  valeurDeclencheur: string | null;
  action: string;
  valeurAction: string | null;
  active: boolean;
  projetId: number;
  creeLe: string;
}

// Données pour créer une nouvelle règle
interface NouvelleRegle {
  nom: string;
  declencheur: string;
  valeurDeclencheur: string;
  action: string;
  valeurAction: string;
}

// =====================
// CONSTANTES
// =====================

// Liste des déclencheurs disponibles
const DECLENCHEURS = [
  { valeur: "tache_statut_change", label: "Une tâche change de statut" },
  { valeur: "tache_creee", label: "Une nouvelle tâche est créée" },
  { valeur: "tache_assignee", label: "Une tâche est assignée" },
  { valeur: "tache_en_retard", label: "Une tâche est en retard" },
];

// Liste des actions disponibles
const ACTIONS = [
  { valeur: "notifier_manager", label: "Notifier le manager" },
  { valeur: "changer_priorite", label: "Changer la priorité" },
  { valeur: "envoyer_email", label: "Envoyer un email" },
];

// Valeurs possibles selon le déclencheur
const VALEURS_DECLENCHEUR: Record<string, string[]> = {
  tache_statut_change: ["À faire", "En cours", "Terminé"],
  tache_creee: [],
  tache_assignee: [],
  tache_en_retard: [],
};

// Valeurs possibles selon l'action
const VALEURS_ACTION: Record<string, string[]> = {
  changer_priorite: ["basse", "normale", "haute", "critique"],
  notifier_manager: [],
  envoyer_email: [],
};

// =====================
// COMPOSANT PRINCIPAL
// =====================
export default function AutomatisationsScreen() {
  // Récupère l'identifiant du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const projetId = parseInt(id);
  const router = useRouter();
  const theme = useTheme();
  const { estTablette } = useBreakpoint();
  const queryClient = useQueryClient();

  // =====================
  // ÉTATS
  // =====================

  // Afficher ou masquer le formulaire de création
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  // Champs du formulaire de création
  const [formulaire, setFormulaire] = useState<NouvelleRegle>({
    nom: "",
    declencheur: "tache_statut_change",
    valeurDeclencheur: "",
    action: "notifier_manager",
    valeurAction: "",
  });

  // Message de retour utilisateur
  const [message, setMessage] = useState<{
    type: "succes" | "erreur";
    texte: string;
  } | null>(null);

  // =====================
  // CHARGEMENT DES RÈGLES
  // =====================
  const {
    data: regles = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<RegleAutomatisation[]>({
    queryKey: ["regles", projetId],
    queryFn: async () => {
      const reponse = await apiClient.get(`/projects/${projetId}/regles`);
      return reponse.data;
    },
  });

  // =====================
  // MUTATION — CRÉER UNE RÈGLE
  // =====================
  const mutationCreer = useMutation({
    mutationFn: async (données: NouvelleRegle) => {
      const reponse = await apiClient.post(
        `/projects/${projetId}/regles`,
        données,
      );
      return reponse.data;
    },
    onSuccess: () => {
      // Recharge la liste des règles
      queryClient.invalidateQueries({ queryKey: ["regles", projetId] });
      setAfficherFormulaire(false);
      setFormulaire({
        nom: "",
        declencheur: "tache_statut_change",
        valeurDeclencheur: "",
        action: "notifier_manager",
        valeurAction: "",
      });
      afficherMessage("succes", "Règle créée avec succès !");
    },
    onError: () => {
      afficherMessage("erreur", "Erreur lors de la création de la règle.");
    },
  });

  // =====================
  // MUTATION — TOGGLE ACTIVER/DÉSACTIVER
  // =====================
  const mutationToggle = useMutation({
    mutationFn: async (regleId: number) => {
      const reponse = await apiClient.patch(`/regles/${regleId}/toggle`);
      return reponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regles", projetId] });
    },
  });

  // =====================
  // MUTATION — SUPPRIMER UNE RÈGLE
  // =====================
  const mutationSupprimer = useMutation({
    mutationFn: async (regleId: number) => {
      await apiClient.delete(`/regles/${regleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regles", projetId] });
      afficherMessage("succes", "Règle supprimée.");
    },
  });

  // =====================
  // FONCTIONS UTILITAIRES
  // =====================

  // Affiche un message temporaire pendant 3 secondes
  function afficherMessage(type: "succes" | "erreur", texte: string) {
    setMessage({ type, texte });
    setTimeout(() => setMessage(null), 3000);
  }

  // Récupère le libellé français d'un déclencheur
  function labelDeclencheur(valeur: string): string {
    return DECLENCHEURS.find((d) => d.valeur === valeur)?.label ?? valeur;
  }

  // Récupère le libellé français d'une action
  function labelAction(valeur: string): string {
    return ACTIONS.find((a) => a.valeur === valeur)?.label ?? valeur;
  }

  // Soumet le formulaire de création
  function handleCreer() {
    if (!formulaire.nom.trim()) {
      afficherMessage("erreur", "Le nom de la règle est obligatoire.");
      return;
    }
    mutationCreer.mutate(formulaire);
  }

  // =====================
  // COMPOSANT SÉLECTEUR INLINE
  // Remplace Alert.alert — compatible web et tablette
  // =====================
  function SelecteurInline({
    options,
    valeurSelectionnee,
    onSelectionner,
    label,
  }: {
    options: { valeur: string; label: string }[];
    valeurSelectionnee: string;
    onSelectionner: (valeur: string) => void;
    label: string;
  }) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.labelChamp, { color: theme.textSecondary }]}>
          {label}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.valeur}
                onPress={() => onSelectionner(option.valeur)}
                style={[
                  styles.optionBadge,
                  {
                    background:
                      valeurSelectionnee === option.valeur
                        ? theme.primary
                        : theme.cardBackground,
                    borderColor:
                      valeurSelectionnee === option.valeur
                        ? theme.primary
                        : theme.border,
                  } as any,
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color:
                      valeurSelectionnee === option.valeur
                        ? "#fff"
                        : theme.text,
                    fontWeight:
                      valeurSelectionnee === option.valeur ? "600" : "400",
                  }}
                >
                  {option.label}
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
    <SafeAreaView
      style={[styles.conteneur, { backgroundColor: theme.background }]}
    >
      {/* ---- EN-TÊTE ---- */}
      <View style={styles.entete}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.boutonRetour}
        >
          <Text style={{ color: theme.primary, fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.titre, { color: theme.text }]}>
          Automatisations
        </Text>
        <TouchableOpacity
          onPress={() => setAfficherFormulaire(!afficherFormulaire)}
          style={[styles.boutonNouvelle, { backgroundColor: theme.primary }]}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            {afficherFormulaire ? "Annuler" : "+ Nouvelle"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contenu,
          estTablette && styles.contenuTablette,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* ---- MESSAGE SUCCÈS / ERREUR ---- */}
        {message && (
          <View
            style={[
              styles.message,
              {
                backgroundColor:
                  message.type === "succes" ? "#EAF3DE" : "#FCEBEB",
              },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                color: message.type === "succes" ? "#3B6D11" : "#A32D2D",
              }}
            >
              {message.texte}
            </Text>
          </View>
        )}

        {/* ---- FORMULAIRE DE CRÉATION ---- */}
        {afficherFormulaire && (
          <View
            style={[
              styles.carte,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.titreCarte, { color: theme.text }]}>
              Nouvelle règle automatique
            </Text>

            {/* Nom de la règle */}
            <Text style={[styles.labelChamp, { color: theme.textSecondary }]}>
              Nom de la règle
            </Text>
            <TextInput
              placeholder="Ex : Notifier quand tâche terminée"
              placeholderTextColor={theme.textSecondary}
              value={formulaire.nom}
              onChangeText={(texte) =>
                setFormulaire({ ...formulaire, nom: texte })
              }
              style={[
                styles.champTexte,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            />

            {/* Sélecteur déclencheur */}
            <SelecteurInline
              label="Quand..."
              options={DECLENCHEURS}
              valeurSelectionnee={formulaire.declencheur}
              onSelectionner={(v) =>
                setFormulaire({
                  ...formulaire,
                  declencheur: v,
                  valeurDeclencheur: "",
                })
              }
            />

            {/* Valeur du déclencheur si applicable */}
            {VALEURS_DECLENCHEUR[formulaire.declencheur]?.length > 0 && (
              <SelecteurInline
                label="Valeur du déclencheur"
                options={VALEURS_DECLENCHEUR[formulaire.declencheur].map(
                  (v) => ({ valeur: v, label: v }),
                )}
                valeurSelectionnee={formulaire.valeurDeclencheur}
                onSelectionner={(v) =>
                  setFormulaire({ ...formulaire, valeurDeclencheur: v })
                }
              />
            )}

            {/* Sélecteur action */}
            <SelecteurInline
              label="Alors..."
              options={ACTIONS}
              valeurSelectionnee={formulaire.action}
              onSelectionner={(v) =>
                setFormulaire({
                  ...formulaire,
                  action: v,
                  valeurAction: "",
                })
              }
            />

            {/* Valeur de l'action si applicable */}
            {VALEURS_ACTION[formulaire.action]?.length > 0 && (
              <SelecteurInline
                label="Valeur de l'action"
                options={VALEURS_ACTION[formulaire.action].map((v) => ({
                  valeur: v,
                  label: v,
                }))}
                valeurSelectionnee={formulaire.valeurAction}
                onSelectionner={(v) =>
                  setFormulaire({ ...formulaire, valeurAction: v })
                }
              />
            )}

            {/* Bouton créer */}
            <TouchableOpacity
              onPress={handleCreer}
              disabled={mutationCreer.isPending}
              style={[styles.boutonCreer, { backgroundColor: theme.primary }]}
            >
              {mutationCreer.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
                >
                  Créer la règle
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ---- LISTE DES RÈGLES ---- */}
        <View
          style={[
            styles.carte,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.titreCarte, { color: theme.text }]}>
            {regles.length} règle{regles.length > 1 ? "s" : ""}
          </Text>

          {/* Chargement */}
          {isLoading && (
            <ActivityIndicator
              color={theme.primary}
              style={{ marginVertical: 20 }}
            />
          )}

          {/* Aucune règle */}
          {!isLoading && regles.length === 0 && (
            <Text style={[styles.texteVide, { color: theme.textSecondary }]}>
              Aucune règle — créez votre première règle !
            </Text>
          )}

          {/* Une carte par règle */}
          {regles.map((regle) => (
            <View
              key={regle.id}
              style={[
                styles.carteRegle,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  opacity: regle.active ? 1 : 0.5,
                },
              ]}
            >
              {/* Nom de la règle */}
              <Text style={[styles.nomRegle, { color: theme.text }]}>
                {regle.nom}
              </Text>

              {/* Description de la règle */}
              <Text
                style={[
                  styles.descriptionRegle,
                  { color: theme.textSecondary },
                ]}
              >
                {labelDeclencheur(regle.declencheur)}
                {regle.valeurDeclencheur ? ` → ${regle.valeurDeclencheur}` : ""}
                {" ⟶ "}
                {labelAction(regle.action)}
                {regle.valeurAction ? ` (${regle.valeurAction})` : ""}
              </Text>

              {/* Boutons activer/désactiver et supprimer */}
              <View style={styles.boutonsRegle}>
                <TouchableOpacity
                  onPress={() => mutationToggle.mutate(regle.id)}
                  style={[
                    styles.boutonToggle,
                    { backgroundColor: regle.active ? "#EAF3DE" : "#f0f0f0" },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: regle.active ? "#3B6D11" : "#888",
                      fontWeight: "500",
                    }}
                  >
                    {regle.active ? "Active" : "Inactive"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => mutationSupprimer.mutate(regle.id)}
                  style={styles.boutonSupprimer}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#c0392b",
                      fontWeight: "500",
                    }}
                  >
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  // Conteneur principal
  conteneur: {
    flex: 1,
  },

  // En-tête avec retour, titre et bouton nouvelle règle
  entete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  boutonRetour: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  titre: {
    fontSize: 16,
    fontWeight: "600",
  },

  boutonNouvelle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  // Contenu scrollable
  contenu: {
    padding: 16,
    gap: 12,
  },

  // Contenu en mode tablette — largeur limitée et centré
  contenuTablette: {
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
  },

  // Message succès ou erreur
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },

  // Carte générique
  carte: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },

  titreCarte: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  // Label d'un champ de formulaire
  labelChamp: {
    fontSize: 11,
    marginBottom: 4,
  },

  // Champ texte du formulaire
  champTexte: {
    fontSize: 13,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },

  // Badge de sélection inline
  optionBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },

  // Bouton créer la règle
  boutonCreer: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  // Texte état vide
  texteVide: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },

  // Carte d'une règle individuelle
  carteRegle: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },

  nomRegle: {
    fontSize: 13,
    fontWeight: "500",
  },

  descriptionRegle: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Ligne des boutons d'une règle
  boutonsRegle: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },

  boutonToggle: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  boutonSupprimer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#fdd",
  },
});
