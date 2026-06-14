// =====================================================
// OfflineBanner — Banniere mode hors ligne
// S'affiche en haut de l'ecran quand l'app
// detecte qu'il n'y a pas de connexion internet
// =====================================================

import { View, Text, StyleSheet } from "react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Colors } from "@/constants/colors";

export function OfflineBanner() {
  const { isOnline, isLoading } = useNetworkStatus();

  // Ne rien afficher pendant le chargement ou si connecte
  if (isLoading || isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📵</Text>
      <Text style={styles.text}>
        Mode hors ligne — Les donnees affichees peuvent ne pas etre a jour
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: { fontSize: 16 },
  text: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
});
