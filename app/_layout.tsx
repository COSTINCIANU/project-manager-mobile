// =====================================================
// RootLayout — Layout racine de l'application
// Initialise : auth, React Query, notifications push
// =====================================================
import { useTheme } from "@/hooks/useTheme";
import "react-native-gesture-handler";
import { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/stores/authStore";
import { notificationService } from "@/services/notificationService";
import { useThemeStore } from "@/stores/themeStore";

// Maintenir le splash screen jusqu'à la fin de l'initialisation
SplashScreen.preventAutoHideAsync();

// Instance React Query partagée dans toute l'app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  // Charge le theme sauvegarde au demarrage de l'app
  const { loadTheme } = useThemeStore();
  const { theme } = useTheme();

  useEffect(() => {
    loadTheme();
  }, []);

  const { initialize, isLoading, isAuthenticated } = useAuthStore();

  // Référence pour stocker les listeners de notifications
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  // Initialisation de l'auth au démarrage
  useEffect(() => {
    initialize();
  }, []);

  // Cache le splash screen quand l'auth est prête
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Enregistrement des notifications push après connexion
  useEffect(() => {
    if (!isAuthenticated) return;

    // Demande la permission et enregistre le token
    notificationService.registerForPushNotifications();

    // Écoute les notifications reçues quand l'app est ouverte
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification reçue:", notification);
      }
    );

    // Écoute les clics sur les notifications
    responseListener.current = notificationService.addNotificationResponseListener((response) => {
      console.log("Notification cliquée:", response);
    });

    // Nettoyage des listeners à la déconnexion
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {/* StatusBar adapte automatiquement selon le theme actif */}
          <StatusBar style={theme.backgroundPrimary === "#0F172A" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
