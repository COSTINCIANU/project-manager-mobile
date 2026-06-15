// =====================================================
// AppLayout — Layout principal avec tabs
// Inclut la banniere offline et la garde d'auth
// =====================================================

import { useEffect } from "react";
import { View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* Banniere affichee quand l'app est hors ligne */}
      <OfflineBanner />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            backgroundColor: Colors.backgroundPrimary,
            borderTopColor: Colors.border,
            borderTopWidth: 0.5,
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Accueil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: "Projets",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="folder-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Taches",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="checkmark-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Alertes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="notifications-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
