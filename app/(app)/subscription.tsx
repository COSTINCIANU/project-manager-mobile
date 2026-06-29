// =====================================================
// SubscriptionScreen — Gestion de l'abonnement
// Affiche les plans disponibles et permet de s'abonner
// Lien vers le portail Stripe pour gérer l'abonnement
// =====================================================

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { tokenService } from "@/services/tokenService";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// Plans disponibles
const PLANS = [
  {
    id: "free",
    nom: "Gratuit",
    prix: "0€",
    periode: "/mois",
    couleur: "#888",
    fonctionnalites: [
      "3 projets maximum",
      "10 tâches par projet",
      "1 membre par projet",
      "Kanban basique",
    ],
  },
  {
    id: "pro",
    nom: "Pro",
    prix: "9€",
    periode: "/mois",
    couleur: "#6366F1",
    recommande: true,
    fonctionnalites: [
      "Projets illimités",
      "Tâches illimitées",
      "5 membres par projet",
      "Assistant IA",
      "Backlog + Sprints",
      "Rapports et Burndown",
      "Champs personnalisés",
    ],
  },
  {
    id: "enterprise",
    nom: "Entreprise",
    prix: "29€",
    periode: "/mois",
    couleur: "#9B7FD4",
    fonctionnalites: [
      "Tout le plan Pro",
      "Membres illimités",
      "API publique",
      "Support prioritaire",
      "SSO / SAML",
      "Rapports avancés",
    ],
  },
];

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const [planEnCours, setPlanEnCours] = useState<string | null>(null);

  // Récupère le plan actuel
  const { data: planActuel, isLoading: chargementPlan } = useQuery<{
    plan: string;
    email: string;
  }>({
    queryKey: ["stripe-plan"],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.STRIPE_PLAN);
      return data;
    },
  });

  // Mutation pour créer une session checkout
  const checkout = useMutation({
    mutationFn: async (plan: string) => {
      const { data } = await apiClient.post(API_ENDPOINTS.STRIPE_CHECKOUT, {
        plan,
      });
      return data;
    },
    onSuccess: (data) => {
      // Ouvre la page de paiement Stripe dans le navigateur
      if (data.url) {
        Linking.openURL(data.url);
      }
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer la session de paiement.");
    },
  });

  // Mutation pour ouvrir le portail client
  const portail = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(API_ENDPOINTS.STRIPE_PORTAL);
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        Linking.openURL(data.url);
      }
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible d'ouvrir le portail de facturation.");
    },
  });

  const handleChoisirPlan = (planId: string) => {
    if (planId === "free") return;
    if (planId === planActuel?.plan) {
      Alert.alert("Plan actuel", "Vous êtes déjà sur ce plan.");
      return;
    }
    setPlanEnCours(planId);
    checkout.mutate(planId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      <ScrollView contentContainerStyle={[styles.contenu, isTablet && styles.contenuTablette]}>
        {/* En-tête */}
        <Text style={[styles.titre, { color: theme.textPrimary }]}>💳 Abonnement</Text>
        <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
          Choisissez le plan adapté à votre équipe
        </Text>

        {/* Plan actuel */}
        {chargementPlan ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          planActuel && (
            <View
              style={[
                styles.planActuelBadge,
                {
                  backgroundColor: theme.primary + "20",
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.textePlanActuel, { color: theme.primary }]}>
                ✅ Plan actuel :{" "}
                {PLANS.find((p) => p.id === planActuel.plan)?.nom ?? planActuel.plan}
              </Text>
            </View>
          )
        )}

        {/* Liste des plans */}
        <View style={[styles.listePlans, isTablet && styles.listePlansTablette]}>
          {PLANS.map((plan) => {
            const estActuel = planActuel?.plan === plan.id;
            return (
              <View
                key={plan.id}
                style={[
                  styles.cartePlan,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: estActuel ? plan.couleur : theme.border,
                  },
                  estActuel && { borderWidth: 2 },
                  plan.recommande && {
                    borderColor: plan.couleur,
                    borderWidth: 2,
                  },
                  isTablet && styles.cartePlanTablette,
                ]}
              >
                {/* Badge recommandé */}
                {plan.recommande && (
                  <View style={[styles.badgeRecommande, { backgroundColor: plan.couleur }]}>
                    <Text style={styles.texteBadgeRecommande}>Recommandé</Text>
                  </View>
                )}

                {/* Nom et prix */}
                <Text style={[styles.nomPlan, { color: plan.couleur }]}>{plan.nom}</Text>
                <View style={styles.lignePrix}>
                  <Text style={[styles.prix, { color: theme.textPrimary }]}>{plan.prix}</Text>
                  <Text style={[styles.periode, { color: theme.textSecondary }]}>
                    {plan.periode}
                  </Text>
                </View>

                {/* Fonctionnalités */}
                <View style={styles.listeFonctionnalites}>
                  {plan.fonctionnalites.map((f, i) => (
                    <View key={i} style={styles.ligneFonctionnalite}>
                      <Text style={[styles.checkFonctionnalite, { color: plan.couleur }]}>✓</Text>
                      <Text style={[styles.texteFonctionnalite, { color: theme.textSecondary }]}>
                        {f}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Bouton */}
                {plan.id === "free" ? (
                  <View
                    style={[
                      styles.boutonPlan,
                      {
                        backgroundColor: theme.backgroundPrimary,
                        borderColor: theme.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text style={[styles.texteBoutonPlan, { color: theme.textSecondary }]}>
                      Plan gratuit
                    </Text>
                  </View>
                ) : estActuel ? (
                  <View style={[styles.boutonPlan, { backgroundColor: plan.couleur + "20" }]}>
                    <Text style={[styles.texteBoutonPlan, { color: plan.couleur }]}>
                      Plan actuel ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.boutonPlan, { backgroundColor: plan.couleur }]}
                    onPress={() => handleChoisirPlan(plan.id)}
                    disabled={checkout.isPending && planEnCours === plan.id}
                  >
                    {checkout.isPending && planEnCours === plan.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.texteBoutonPlan, { color: "#fff" }]}>
                        Choisir {plan.nom}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Télécharger la facture */}
        {planActuel?.plan !== "free" && (
          <TouchableOpacity
            style={[styles.boutonPortail, { borderColor: theme.border }]}
            onPress={async () => {
              try {
                // Génère un token temporaire de téléchargement
                const { data } = await apiClient.post(API_ENDPOINTS.STRIPE_INVOICE_TOKEN);
                if (data.url) {
                  Linking.openURL(data.url);
                }
              } catch (e) {
                Alert.alert("Erreur", "Impossible de télécharger la facture.");
              }
            }}
          >
            <Text style={[styles.texteBoutonPortail, { color: theme.primary }]}>
              📄 Télécharger ma dernière facture
            </Text>
          </TouchableOpacity>
        )}
        {/* Portail de facturation */}
        {planActuel?.plan !== "free" && (
          <TouchableOpacity
            style={[styles.boutonPortail, { borderColor: theme.border }]}
            onPress={() => portail.mutate()}
            disabled={portail.isPending}
          >
            {portail.isPending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.texteBoutonPortail, { color: theme.primary }]}>
                🧾 Gérer mon abonnement et mes factures
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Note de sécurité */}
        <Text style={[styles.noteSecurite, { color: theme.textSecondary }]}>
          🔒 Paiement sécurisé par Stripe. Annulez à tout moment.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contenu: { padding: 16, gap: 16 },
  contenuTablette: {
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    padding: 24,
  },
  titre: { fontSize: 22, fontWeight: "700" },
  sousTitre: { fontSize: 14 },
  planActuelBadge: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  textePlanActuel: { fontSize: 14, fontWeight: "600" },
  listePlans: { gap: 16 },
  listePlansTablette: { flexDirection: "row", flexWrap: "wrap" },
  cartePlan: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cartePlanTablette: { flex: 1, minWidth: "30%" },
  badgeRecommande: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  texteBadgeRecommande: { color: "#fff", fontSize: 11, fontWeight: "600" },
  nomPlan: { fontSize: 20, fontWeight: "700" },
  lignePrix: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  prix: { fontSize: 32, fontWeight: "700" },
  periode: { fontSize: 14, marginBottom: 4 },
  listeFonctionnalites: { gap: 6 },
  ligneFonctionnalite: { flexDirection: "row", gap: 8 },
  checkFonctionnalite: { fontSize: 14, fontWeight: "700" },
  texteFonctionnalite: { fontSize: 13, flex: 1 },
  boutonPlan: { padding: 12, borderRadius: 10, alignItems: "center" },
  texteBoutonPlan: { fontSize: 14, fontWeight: "600" },
  boutonPortail: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  texteBoutonPortail: { fontSize: 14, fontWeight: "500" },
  noteSecurite: { fontSize: 12, textAlign: "center" },
});
