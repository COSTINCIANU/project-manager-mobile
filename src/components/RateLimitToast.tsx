// =====================================================
// RateLimitToast.tsx — Toast d'alerte rate limiting
// Affiche un message quand l'API renvoie une erreur 429
// Écoute l'événement global émis par apiClient
// =====================================================
import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function RateLimitToast() {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "rate-limit-error",
      (data: { message: string }) => {
        setMessage(data.message);

        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Masque automatiquement après 5 secondes
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setMessage(null));
        }, 5000);
      }
    );

    return () => subscription.remove();
  }, [opacity]);

  if (!message) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#A32D2D",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 8,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: { fontSize: 16 },
  text: { color: "#fff", fontSize: 13, fontWeight: "500", flexShrink: 1 },
});
