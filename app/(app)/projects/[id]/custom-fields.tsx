// =====================================================
// custom-fields.tsx — Champs personnalisés d'un projet
// Permet d'ajouter des champs sur mesure à un projet
// Types : texte, nombre, date, oui/non
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
  Switch,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";

// Type d'un champ personnalisé
interface CustomField {
  id: number;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  value: string | null;
  projectId: number;
  taskId: number | null;
}

// Types de champs disponibles
const TYPES_DISPONIBLES = [
  { value: "text", label: "Texte", exemple: "ex: Nom du client" },
  { value: "number", label: "Nombre", exemple: "ex: Budget" },
  { value: "date", label: "Date", exemple: "ex: Date de livraison" },
  { value: "boolean", label: "Oui/Non", exemple: "ex: Approuvé" },
];

export default function CustomFieldsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = parseInt(id);
  const { theme } = useTheme();
  const { isTablet } = useBreakpoint();
  const router = useRouter();
  const queryClient = useQueryClient();

  // États du formulaire de création
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [nomChamp, setNomChamp] = useState("");
  const [labelChamp, setLabelChamp] = useState("");
  const [typeChamp, setTypeChamp] = useState<"text" | "number" | "date" | "boolean">("text");

  // Récupère les champs du projet
  const { data: champs, isLoading } = useQuery<CustomField[]>({
    queryKey: ["custom-fields", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(API_ENDPOINTS.CUSTOM_FIELDS_BY_PROJECT(projectId));
      return data;
    },
  });

  // Création d'un champ
  const creerChamp = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(API_ENDPOINTS.CUSTOM_FIELD_CREATE, {
        name: nomChamp.toLowerCase().replace(/\s+/g, "_"),
        label: labelChamp,
        type: typeChamp,
        projectId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] });
      setAfficherFormulaire(false);
      setNomChamp("");
      setLabelChamp("");
      setTypeChamp("text");
    },
    onError: () => {
      Alert.alert("Erreur", "Impossible de créer le champ.");
    },
  });

  // Mise à jour de la valeur d'un champ
  const modifierValeur = useMutation({
    mutationFn: async ({ champId, valeur }: { champId: number; valeur: string }) => {
      const { data } = await apiClient.put(API_ENDPOINTS.CUSTOM_FIELD_UPDATE(champId), {
        value: valeur,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] });
    },
  });

  // Suppression d'un champ
  const supprimerChamp = useMutation({
    mutationFn: async (champId: number) => {
      await apiClient.delete(API_ENDPOINTS.CUSTOM_FIELD_DELETE(champId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields", projectId] });
    },
  });

  // Confirme la suppression
  const confirmerSuppression = (champ: CustomField) => {
    Alert.alert("Supprimer le champ", `Voulez-vous supprimer le champ "${champ.label}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => supprimerChamp.mutate(champ.id),
      },
    ]);
  };

  // Valide et soumet le formulaire
  const validerCreation = () => {
    if (!labelChamp.trim()) {
      Alert.alert("Erreur", "Le nom affiché est requis.");
      return;
    }
    creerChamp.mutate();
  };

  // Affiche le bon composant de saisie selon le type
  const renderSaisieValeur = (champ: CustomField) => {
    switch (champ.type) {
      case "boolean":
        return (
          <Switch
            value={champ.value === "true"}
            onValueChange={(val) =>
              modifierValeur.mutate({
                champId: champ.id,
                valeur: val.toString(),
              })
            }
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        );
      default:
        return (
          <TextInput
            style={[
              styles.inputValeur,
              {
                backgroundColor: theme.backgroundPrimary,
                color: theme.textPrimary,
                borderColor: theme.border,
              },
            ]}
            placeholder="Saisir une valeur..."
            placeholderTextColor={theme.textSecondary}
            value={champ.value ?? ""}
            keyboardType={champ.type === "number" ? "numeric" : "default"}
            onEndEditing={(e) =>
              modifierValeur.mutate({
                champId: champ.id,
                valeur: e.nativeEvent.text,
              })
            }
          />
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
      <ScrollView contentContainerStyle={[styles.contenu, isTablet && styles.contenuTablette]}>
        {/* Bouton retour */}
        <TouchableOpacity style={styles.boutonRetour} onPress={() => router.back()}>
          <Text style={[styles.texteBoutonRetour, { color: theme.primary }]}>← Retour</Text>
        </TouchableOpacity>

        {/* Titre */}
        <View style={styles.entete}>
          <Text style={[styles.titre, { color: theme.textPrimary }]}>Champs personnalisés</Text>
          <TouchableOpacity
            style={[styles.boutonAjouter, { backgroundColor: theme.primary }]}
            onPress={() => setAfficherFormulaire(!afficherFormulaire)}
          >
            <Text style={styles.texteBoutonAjouter}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
          Ajoutez des informations spécifiques à votre projet
        </Text>

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
            <Text style={[styles.formulaireTitre, { color: theme.textPrimary }]}>
              Nouveau champ
            </Text>

            {/* Nom affiché */}
            <View style={styles.champFormulaire}>
              <Text style={[styles.labelFormulaire, { color: theme.textPrimary }]}>
                Nom affiché *
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
                placeholder="ex: Budget, Nom du client..."
                placeholderTextColor={theme.textSecondary}
                value={labelChamp}
                onChangeText={(text) => {
                  setLabelChamp(text);
                  setNomChamp(text);
                }}
              />
            </View>

            {/* Type de champ */}
            <View style={styles.champFormulaire}>
              <Text style={[styles.labelFormulaire, { color: theme.textPrimary }]}>
                Type de champ
              </Text>
              <View style={styles.typesGrille}>
                {TYPES_DISPONIBLES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeBouton,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.backgroundPrimary,
                      },
                      typeChamp === type.value && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => setTypeChamp(type.value as any)}
                  >
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: theme.textPrimary },
                        typeChamp === type.value && { color: "#fff" },
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeExemple,
                        { color: theme.textSecondary },
                        typeChamp === type.value && { color: "#fff" },
                      ]}
                    >
                      {type.exemple}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Boutons */}
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
                style={[styles.boutonCreer, { backgroundColor: theme.primary }]}
                onPress={validerCreation}
                disabled={creerChamp.isPending}
              >
                {creerChamp.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.texteBoutonCreer}>Créer le champ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Liste des champs */}
        {champs && champs.length === 0 ? (
          <View style={styles.vide}>
            <Text style={[styles.texteVide, { color: theme.textSecondary }]}>
              Aucun champ personnalisé pour ce projet.{"\n"}
              Cliquez sur "+ Ajouter" pour en créer un.
            </Text>
          </View>
        ) : (
          <View style={styles.listeChamps}>
            {champs?.map((champ) => (
              <View
                key={champ.id}
                style={[
                  styles.carteChamp,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.enteteChamp}>
                  <View>
                    <Text style={[styles.labelChamp, { color: theme.textPrimary }]}>
                      {champ.label}
                    </Text>
                    <Text style={[styles.typeChampTexte, { color: theme.textSecondary }]}>
                      {TYPES_DISPONIBLES.find((t) => t.value === champ.type)?.label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmerSuppression(champ)}>
                    <Text style={[styles.boutonSupprimer, { color: theme.danger ?? "#e74c3c" }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.saisieValeur}>{renderSaisieValeur(champ)}</View>
              </View>
            ))}
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
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
    padding: 24,
  },
  boutonRetour: { padding: 4 },
  texteBoutonRetour: { fontSize: 15 },
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titre: { fontSize: 22, fontWeight: "700" },
  sousTitre: { fontSize: 13, marginTop: -8 },
  boutonAjouter: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  texteBoutonAjouter: { color: "#fff", fontSize: 13, fontWeight: "600" },
  formulaire: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 14 },
  formulaireTitre: { fontSize: 16, fontWeight: "600" },
  champFormulaire: { gap: 8 },
  labelFormulaire: { fontSize: 14, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  typesGrille: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeBouton: {
    width: "48%",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  typeLabel: { fontSize: 14, fontWeight: "600" },
  typeExemple: { fontSize: 11 },
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
  vide: { padding: 40, alignItems: "center" },
  texteVide: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  listeChamps: { gap: 12 },
  carteChamp: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  enteteChamp: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  labelChamp: { fontSize: 15, fontWeight: "600" },
  typeChampTexte: { fontSize: 12, marginTop: 2 },
  boutonSupprimer: { fontSize: 18, fontWeight: "700", padding: 4 },
  saisieValeur: { marginTop: 4 },
  inputValeur: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
});
