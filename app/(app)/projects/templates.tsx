// =====================================================
// templates.tsx — Écran de sélection de template
// Affiche les templates disponibles avec leurs tâches
// L'utilisateur choisit un template et donne un nom au projet
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
} from "react-native";
import { useNavigation } from "expo-router";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// Type d'un template reçu depuis l'API
interface TemplateTask {
  id: number;
  name: string;
  priority: string;
  position: number;
}

interface Template {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  tasksCount: number;
  tasks: TemplateTask[];
}

export default function TemplatesScreen() {
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Template sélectionné par l'utilisateur
  const [templateChoisi, setTemplateChoisi] = useState<Template | null>(null);
  // Nom du projet à créer
  const [nomProjet, setNomProjet] = useState("");
  // Affiche ou cache le formulaire de création
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  // Récupère la liste des templates depuis l'API
  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.TEMPLATES);
      return data;
    },
  });

  // Mutation pour créer un projet depuis un template
  const creerProjetDepuisTemplate = useMutation({
    mutationFn: async ({ templateId, nom }: { templateId: number; nom: string }) => {
      const { data } = await apiClient.post(API_ENDPOINTS.TEMPLATE_CREATE_PROJECT(templateId), {
        name: nom,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      Alert.alert(
        "Projet créé !",
        `Le projet "${data.projectName}" a été créé avec ${data.tasksCreated} tâches.`,
        [
          {
            text: "Voir le projet",
            onPress: () => router.push(`/projects/${data.projectId}`),
          },
        ]
      );
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer le projet. Réessayez.");
    },
  });

  // Quand l'utilisateur clique sur un template
  const choisirTemplate = (template: Template) => {
    setTemplateChoisi(template);
    setNomProjet(template.name);
    setAfficherFormulaire(true);
  };

  // Quand l'utilisateur confirme la création du projet
  const confirmerCreation = () => {
    if (!nomProjet.trim()) {
      Alert.alert("Erreur", "Le nom du projet est requis.");
      return;
    }
    if (!templateChoisi) return;

    creerProjetDepuisTemplate.mutate({
      templateId: templateChoisi.id,
      nom: nomProjet.trim(),
    });
  };

  // Couleur de badge selon la priorité
  const couleurPriorite = (priority: string) => {
    switch (priority) {
      case "critique":
        return "#e74c3c";
      case "haute":
        return "#e67e22";
      case "normale":
        return "#378ADD";
      case "basse":
        return "#639922";
      default:
        return "#888";
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centré, { backgroundColor: theme.backgroundPrimary }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.texteChargement, { color: theme.textSecondary }]}>
          Chargement des templates...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.backgroundPrimary }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
        <View style={[styles.contenu, isTablet && styles.contenuTablette]}>
          {/* En-tête */}
          {/* Bouton retour + titre */}
          <TouchableOpacity onPress={() => router.back()} style={styles.boutonRetour}>
            <Text style={[styles.texteBoutonRetour, { color: theme.primary }]}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.titre, { color: theme.textPrimary }]}>Choisir un template</Text>
          <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
            Crée un projet avec des tâches préremplies
          </Text>

          {/* Formulaire de création — affiché après avoir choisi un template */}
          {afficherFormulaire && templateChoisi && (
            <View
              style={[
                styles.formulaire,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: templateChoisi.color,
                },
              ]}
            >
              <Text style={[styles.formulaireTitre, { color: theme.textPrimary }]}>
                Nouveau projet depuis "{templateChoisi.name}"
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
                placeholder="Nom du projet"
                placeholderTextColor={theme.textSecondary}
                value={nomProjet}
                onChangeText={setNomProjet}
              />
              <View style={styles.boutonsFormulaire}>
                <TouchableOpacity
                  style={[styles.boutonAnnuler, { borderColor: theme.border }]}
                  onPress={() => setAfficherFormulaire(false)}
                >
                  <Text style={[styles.texteBoutonAnnuler, { color: theme.textSecondary }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.boutonCreer, { backgroundColor: templateChoisi.color }]}
                  onPress={confirmerCreation}
                  disabled={creerProjetDepuisTemplate.isPending}
                >
                  {creerProjetDepuisTemplate.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.texteBoutonCreer}>Créer le projet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Liste des templates */}
          <View style={[styles.grille, isTablet && styles.grilleTablette]}>
            {templates?.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.carteTemplate,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                  },
                  templateChoisi?.id === template.id && {
                    borderColor: template.color,
                    borderWidth: 2,
                  },
                  isTablet && styles.carteTemplateTablette,
                ]}
                onPress={() => choisirTemplate(template)}
              >
                {/* Bande de couleur en haut de la carte */}
                <View style={[styles.bandeColor, { backgroundColor: template.color }]} />

                <View style={styles.carteContenu}>
                  {/* Nom et description */}
                  <Text style={[styles.nomTemplate, { color: theme.textPrimary }]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.descriptionTemplate, { color: theme.textSecondary }]}>
                    {template.description}
                  </Text>

                  {/* Nombre de tâches */}
                  <Text style={[styles.nombreTaches, { color: template.color }]}>
                    {template.tasksCount} tâches incluses
                  </Text>

                  {/* Liste des tâches préremplies */}
                  <View style={styles.listeTaches}>
                    {template.tasks.slice(0, 3).map((tache) => (
                      <View key={tache.id} style={styles.ligneTache}>
                        <View
                          style={[
                            styles.pointPriorite,
                            {
                              backgroundColor: couleurPriorite(tache.priority),
                            },
                          ]}
                        />
                        <Text style={[styles.nomTache, { color: theme.textSecondary }]}>
                          {tache.name}
                        </Text>
                      </View>
                    ))}
                    {template.tasks.length > 3 && (
                      <Text style={[styles.plusDeTaches, { color: theme.textSecondary }]}>
                        +{template.tasks.length - 3} autres tâches...
                      </Text>
                    )}
                  </View>

                  {/* Bouton choisir */}
                  <TouchableOpacity
                    style={[styles.boutonChoisir, { backgroundColor: template.color }]}
                    onPress={() => choisirTemplate(template)}
                  >
                    <Text style={styles.texteBoutonChoisir}>Utiliser ce template</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centré: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  texteChargement: {
    fontSize: 14,
  },
  contenu: {
    padding: 16,
  },
  contenuTablette: {
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    padding: 24,
  },
  titre: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  sousTitre: {
    fontSize: 14,
    marginBottom: 20,
  },
  formulaire: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    gap: 12,
  },
  formulaireTitre: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  boutonsFormulaire: {
    flexDirection: "row",
    gap: 10,
  },
  boutonAnnuler: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  texteBoutonAnnuler: {
    fontSize: 14,
    fontWeight: "500",
  },
  boutonCreer: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  texteBoutonCreer: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  grille: {
    gap: 16,
  },
  grilleTablette: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  carteTemplate: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  carteTemplateTablette: {
    width: "48%",
  },
  bandeColor: {
    height: 6,
  },
  carteContenu: {
    padding: 16,
    gap: 8,
  },
  nomTemplate: {
    fontSize: 18,
    fontWeight: "700",
  },
  descriptionTemplate: {
    fontSize: 13,
  },
  nombreTaches: {
    fontSize: 13,
    fontWeight: "600",
  },
  listeTaches: {
    gap: 4,
    marginTop: 4,
  },
  ligneTache: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointPriorite: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nomTache: {
    fontSize: 13,
  },
  plusDeTaches: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  boutonChoisir: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  texteBoutonChoisir: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
  },

  boutonRetour: {
    padding: 4,
  },
  texteBoutonRetour: {
    fontSize: 15,
  },
});
