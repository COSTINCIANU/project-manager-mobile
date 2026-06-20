// =====================================================
// NotificationsScreen — Centre de notifications
// Affiche toutes les notifications de l'utilisateur
// avec possibilite de les marquer comme lues
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";

// Type notification — adapte a la reponse de l'API Symfony
interface Notification {
  id: number;
  mentionedByEmail: string; // Email de la personne qui a mentionne
  commentId: number; // ID du commentaire concerne
  taskId: number; // ID de la tache concernee
  isRead: boolean; // Statut de lecture
  createdAt: string; // Date de creation
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hook de navigation pour rediriger vers la tache
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  const { isTablet } = useBreakpoint();

  // Charge les notifications depuis l'API
  const loadNotifications = async () => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erreur chargement notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Charge les notifications au demarrage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Marque une notification comme lue
  const markAsRead = async (id: number) => {
    try {
      // L'API utilise PUT et pas POST pour marquer comme lue
      await apiClient.put(API_ENDPOINTS.NOTIFICATION_READ(id), {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.log("Erreur mark as read:", error);
    }
  };

  // Marque toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      // L'API utilise PUT et pas POST pour marquer toutes comme lues
      await apiClient.put(API_ENDPOINTS.NOTIFICATION_READ_ALL, {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.log("Erreur mark all as read:", error);
    }
  };

  // Pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  // Nombre de notifications non lues
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      {/* En-tete */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadCount, { color: theme.primary }]}>
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={[
              styles.markAllButton,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <Text style={[styles.markAllText, { color: theme.primary }]}>
              Tout lire
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, isTablet && styles.listTablet]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notifCard,
              {
                backgroundColor: theme.backgroundPrimary,
                borderColor: theme.border,
              },
              !item.isRead && {
                borderColor: theme.primary + "40",
                backgroundColor: theme.primary + "05",
              },
            ]}
            onPress={() => {
              // Marque la notification comme lue
              markAsRead(item.id);
              // Navigue vers la tache concernee si taskId disponible
              if (item.taskId) {
                router.push(`/(app)/tasks/${item.taskId}` as any);
              }
            }}
            activeOpacity={0.7}
          >
            {/* Indicateur non lu */}
            {!item.isRead && (
              <View
                style={[styles.unreadDot, { backgroundColor: theme.primary }]}
              />
            )}

            {/* Icone de la notification — toujours une mention */}
            <View
              style={[
                styles.notifIcon,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              <Text style={styles.notifIconText}>@</Text>
            </View>

            {/* Contenu */}
            <View style={styles.notifContent}>
              <Text
                style={[styles.notifMessage, { color: theme.textPrimary }]}
                numberOfLines={2}
              >
                Mention de {item.mentionedByEmail}
              </Text>
              <Text style={[styles.notifDate, { color: theme.textTertiary }]}>
                {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
              Aucune notification
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Vous serez notifie des activites de vos projets ici
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// =====================
// STYLES — valeurs fixes uniquement
// Les couleurs sont appliquees dynamiquement via theme
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // En-tete
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700" },
  unreadCount: { fontSize: 13, marginTop: 2 },
  markAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markAllText: { fontSize: 13, fontWeight: "500" },

  // Liste
  list: { padding: 16, gap: 8 },

  // Carte notification
  notifCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 0.5,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notifIconText: { fontSize: 18 },
  notifContent: { flex: 1, gap: 4 },
  notifMessage: { fontSize: 14, lineHeight: 20 },
  notifDate: { fontSize: 12 },

  // Etat vide
  empty: { padding: 40, alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptySubtext: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  // Ajoute ici
  listTablet: {
    padding: 24,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
});
