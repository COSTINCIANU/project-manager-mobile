// =====================================================
// notificationService — Gestion des notifications push
// Demande la permission et écoute les notifications.
// Le token push nécessite un development build (pas Expo Go)
// =====================================================

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configuration de l'affichage des notifications
// quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Demande la permission de notifications.
   * Le token push ne fonctionne pas dans Expo Go —
   * uniquement dans un development build.
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Fonctionne uniquement sur un vrai appareil
    if (!Device.isDevice) {
      console.log("Notifications push : appareil physique requis");
      return null;
    }

    // Vérifie les permissions actuelles
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Demande la permission si pas encore accordée
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Si permission refusée, on arrête
    if (finalStatus !== "granted") {
      console.log("Permission notifications refusée");
      return null;
    }

    // Configuration spéciale Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Project Manager",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366F1",
      });
    }

    // Token push non disponible dans Expo Go
    // À activer en Phase 6 avec un development build EAS
    console.log("Token push : disponible uniquement en development build");
    return null;
  },

  /**
   * Écoute les notifications reçues quand l'app est ouverte.
   * Retourne le listener pour pouvoir l'arrêter plus tard.
   */
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void,
  ) {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Écoute les clics sur les notifications.
   * Retourne le listener pour pouvoir l'arrêter plus tard.
   */
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void,
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },
};
