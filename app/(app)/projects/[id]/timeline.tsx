// =====================================================
// timeline.tsx — Vue Timeline du projet (mobile)
// Affiche les taches et jalons sur un axe temporel
// horizontal avec scroll
// =====================================================
import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useTheme } from "@/hooks/useTheme";

// =====================
// TYPES
// =====================
interface Jalon {
  id: number;
  nom: string;
  date: string;
  atteint: boolean;
  couleur: string;
}

interface Tache {
  id: number;
  name: string;
  priority: string;
  done: boolean;
  dueDate: string | null;
}

const COULEURS_PRIORITE: Record<string, string> = {
  critique: "#e74c3c",
  haute: "#e67e22",
  normale: "#378ADD",
  basse: "#639922",
};

// =====================
// COMPOSANT PRINCIPAL
// =====================
export default function TimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projetId = parseInt(id);
  const router = useRouter();
  const { theme } = useTheme();

  const [joursAffiches, setJoursAffiches] = useState(30);

  // Date de debut — 7 jours avant aujourd'hui
  const dateDebut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Date de fin
  const dateFin = useMemo(() => {
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + joursAffiches);
    return d;
  }, [dateDebut, joursAffiches]);

  // =====================
  // CHARGEMENT DES TACHES
  // =====================
  const { data: taches = [], isLoading: chargementTaches } = useQuery<Tache[]>({
    queryKey: ["taches-timeline", projetId],
    queryFn: async () => {
      const reponse = await apiClient.get(`/api/tasks?projectId=${projetId}`);
      return reponse.data;
    },
  });

  // =====================
  // CHARGEMENT DES JALONS
  // =====================
  const { data: jalons = [], isLoading: chargementJalons } = useQuery<Jalon[]>({
    queryKey: ["jalons-timeline", projetId],
    queryFn: async () => {
      const reponse = await apiClient.get(`/api/projets/${projetId}/jalons`);
      return reponse.data;
    },
  });

  // Taches avec date d'echeance, dans la fenetre affichee
  const tachesAffichees = useMemo(() => {
    return taches.filter((t) => t.dueDate);
  }, [taches]);

  // =====================
  // CALCUL POSITION (en %)
  // =====================
  function getPositionPct(dateStr: string): number | null {
    const date = new Date(dateStr);
    const totalMs = dateFin.getTime() - dateDebut.getTime();
    const pct = ((date.getTime() - dateDebut.getTime()) / totalMs) * 100;
    if (pct < 0 || pct > 100) return null;
    return pct;
  }

  function formaterJour(date: Date): string {
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  }

  const today = new Date();
  const todayPct = getPositionPct(today.toISOString());

  const LARGEUR_TIMELINE = 900;

  const chargement = chargementTaches || chargementJalons;

  return (
    <SafeAreaView style={[styles.conteneur, { backgroundColor: theme.backgroundTertiary }]}>
      {/* EN-TÊTE */}
      <View style={[styles.entete, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.boutonRetour}>
          <Text style={{ color: theme.primary, fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.titre, { color: theme.textPrimary }]}>📅 Timeline</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* SÉLECTEUR DE PÉRIODE */}
      <View style={styles.selecteurPeriode}>
        {[14, 30, 60, 90].map((jours) => (
          <TouchableOpacity
            key={jours}
            onPress={() => setJoursAffiches(jours)}
            style={[
              styles.boutonPeriode,
              {
                backgroundColor: joursAffiches === jours ? theme.primary : theme.backgroundPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                color: joursAffiches === jours ? "#fff" : theme.textSecondary,
                fontWeight: "600",
              }}
            >
              {jours}j
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {chargement ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
          <View style={{ width: LARGEUR_TIMELINE, padding: 16 }}>
            {/* AXE DES DATES + JALONS */}
            <View style={[styles.axeContainer, { borderBottomColor: theme.border }]}>
              {/* Ligne aujourd'hui */}
              {todayPct !== null && (
                <View
                  style={[
                    styles.ligneAujourdhui,
                    { left: `${todayPct}%`, backgroundColor: theme.primary },
                  ]}
                />
              )}

              {/* Marqueurs jalons */}
              {jalons.map((jalon) => {
                const pct = getPositionPct(jalon.date);
                if (pct === null) return null;
                return (
                  <View
                    key={`jalon-${jalon.id}`}
                    style={[styles.marqueurJalon, { left: `${pct}%` }]}
                  >
                    <Text style={{ fontSize: 14 }}>🏁</Text>
                  </View>
                );
              })}
            </View>

            {/* LISTE DES TÂCHES SUR L'AXE */}
            {tachesAffichees.length === 0 ? (
              <View style={styles.centre}>
                <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
                  Aucune tâche avec date d'échéance
                </Text>
              </View>
            ) : (
              tachesAffichees.map((tache) => {
                const pct = getPositionPct(tache.dueDate!);
                if (pct === null) return null;
                const couleur = COULEURS_PRIORITE[tache.priority] || "#aaa";

                return (
                  <View
                    key={tache.id}
                    style={[styles.ligneTache, { borderBottomColor: theme.border }]}
                  >
                    <Text
                      style={[
                        styles.nomTache,
                        {
                          color: tache.done ? theme.textTertiary : theme.textPrimary,
                          textDecorationLine: tache.done ? "line-through" : "none",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {tache.name}
                    </Text>
                    <View style={styles.barreContainer}>
                      <View
                        style={[
                          styles.barreTache,
                          {
                            left: `${Math.max(0, pct - 3)}%`,
                            backgroundColor: tache.done ? "#ccc" : couleur,
                          },
                        ]}
                      />
                      {/* Lignes jalons verticales */}
                      {jalons.map((jalon) => {
                        const jPct = getPositionPct(jalon.date);
                        if (jPct === null) return null;
                        return (
                          <View
                            key={`ligne-${jalon.id}-${tache.id}`}
                            style={[
                              styles.ligneJalonVerticale,
                              { left: `${jPct}%`, borderLeftColor: jalon.couleur || "#9B7FD4" },
                            ]}
                          />
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
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
  boutonRetour: { width: 60 },
  titre: { fontSize: 16, fontWeight: "600" },
  selecteurPeriode: { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  boutonPeriode: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  centre: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  axeContainer: { height: 24, position: "relative", borderBottomWidth: 1, marginBottom: 8 },
  ligneAujourdhui: { position: "absolute", top: 0, bottom: 0, width: 2, opacity: 0.5 },
  marqueurJalon: { position: "absolute", top: 0, transform: [{ translateX: -7 }] },
  ligneTache: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  nomTache: { width: 140, fontSize: 12, flexShrink: 0 },
  barreContainer: { flex: 1, height: 20, position: "relative" },
  barreTache: { position: "absolute", top: 4, width: 30, height: 12, borderRadius: 4 },
  ligneJalonVerticale: {
    position: "absolute",
    top: -20,
    bottom: -10,
    borderLeftWidth: 1,
    opacity: 0.4,
  },
});
