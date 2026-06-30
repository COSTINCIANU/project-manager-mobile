// =====================================================
// history.tsx — Écran historique des actions
// Affiche les 50 dernières actions effectuées
// dans l'application
// =====================================================
import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { apiClient } from "@/api/client";
import { useTheme } from "@/hooks/useTheme";

// =====================
// TYPES
// =====================
interface ActionLog {
  id: number;
  action: string;
  description: string;
  userEmail: string;
  entityType: string | null;
  entityId: number | null;
  ipAddress: string | null;
  createdAt: string;
}

// =====================
// ICÔNE SELON L'ACTION
// =====================
function getActionIcon(action: string): string {
  switch (action) {
    case "create_task":
      return "✅";
    case "update_task":
      return "✏️";
    case "delete_task":
      return "🗑️";
    case "create_project":
      return "📁";
    case "update_project":
      return "📝";
    case "delete_project":
      return "❌";
    default:
      return "📌";
  }
}

// =====================
// COULEUR SELON L'ACTION
// =====================
function getActionColor(action: string): { bg: string; color: string } {
  if (action.startsWith("create")) return { bg: "#EAF3DE", color: "#3B6D11" };
  if (action.startsWith("update")) return { bg: "#E8F4FD", color: "#1976D2" };
  if (action.startsWith("delete")) return { bg: "#FCEBEB", color: "#A32D2D" };
  return { bg: "#f0f0f0", color: "#666" };
}

// =====================
// FORMATAGE DE LA DATE
// =====================
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================
// COMPOSANT PRINCIPAL
// =====================
export default function HistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadLogs() {
    try {
      const { data } = await apiClient.get("/api/logs");
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error("Erreur chargement historique :", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadLogs();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
      {/* En-tête */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: theme.primary, fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>📋 Historique</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: theme.textTertiary, fontSize: 13 }}>
                Aucune action enregistrée
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const colorStyle = getActionColor(item.action);
            return (
              <View
                style={[
                  styles.logCard,
                  { backgroundColor: theme.backgroundPrimary, borderColor: theme.border },
                ]}
              >
                <Text style={styles.icon}>{getActionIcon(item.action)}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text
                      style={[styles.description, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colorStyle.bg }]}>
                      <Text style={[styles.badgeText, { color: colorStyle.color }]}>
                        {item.action.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.userEmail} — {formatDate(item.createdAt)}
                    {item.ipAddress ? ` — ${item.ipAddress}` : ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { width: 60 },
  title: { fontSize: 16, fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  list: { padding: 16, gap: 8 },
  logCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  icon: { fontSize: 18, marginTop: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: 8 },
  description: { fontSize: 13, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  meta: { fontSize: 11, marginTop: 4 },
});
