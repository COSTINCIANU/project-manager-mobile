// =====================================================
// NotificationsScreen — Centre de notifications
// Affiche toutes les notifications de l'utilisateur
// avec possibilite de les marquer comme lues
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors } from "@/constants/colors";

// Type notification
interface Notification {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      await apiClient.post(API_ENDPOINTS.NOTIFICATION_READ(id), {});
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
      await apiClient.post(API_ENDPOINTS.NOTIFICATION_READ_ALL, {});
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

  // Icone selon le type de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task":
        return "✅";
      case "comment":
        return "💬";
      case "mention":
        return "@";
      case "invite":
        return "👥";
      case "deadline":
        return "⏰";
      default:
        return "🔔";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tete */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
          >
            {/* Indicateur non lu */}
            {!item.isRead && <View style={styles.unreadDot} />}

            {/* Icone du type */}
            <View style={styles.notifIcon}>
              <Text style={styles.notifIconText}>
                {getNotificationIcon(item.type)}
              </Text>
            </View>

            {/* Contenu */}
            <View style={styles.notifContent}>
              <Text style={styles.notifMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notifDate}>
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
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubtext}>
              Vous serez notifie des activites de vos projets ici
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // En-tete
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },
  unreadCount: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  markAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  markAllText: { fontSize: 13, color: Colors.primary, fontWeight: "500" },

  // Liste
  list: { padding: 16, gap: 8 },

  // Carte notification
  notifCard: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  notifCardUnread: {
    borderColor: Colors.primary + "40",
    backgroundColor: Colors.primary + "05",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  notifIconText: { fontSize: 18 },
  notifContent: { flex: 1, gap: 4 },
  notifMessage: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  notifDate: { fontSize: 12, color: Colors.textTertiary },

  // Etat vide
  empty: { padding: 40, alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
