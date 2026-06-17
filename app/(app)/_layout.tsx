// =====================================================
// AppLayout — Layout principal avec tabs
// Gere iOS et Android dans un seul fichier
// Sur Android : navigation en HAUT de l'ecran
// Sur iOS : navigation en BAS de l'ecran
// =====================================================

import { useEffect } from "react";
import { Tabs, useRouter, usePathname } from "expo-router";
import { View, Platform, TouchableOpacity, Text } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

// =====================================================
// AndroidTopBar — Barre de navigation en haut
// Utilise usePathname pour detecter l'onglet actif
// et useRouter pour naviguer entre les onglets
// =====================================================
function AndroidTopBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Definition des onglets
  const tabs = [
    { name: "Accueil", path: "/(app)", icon: "home-outline" },
    { name: "Projets", path: "/(app)/projects", icon: "folder-outline" },
    { name: "Taches", path: "/(app)/tasks", icon: "checkmark-circle-outline" },
    {
      name: "Alertes",
      path: "/(app)/notifications",
      icon: "notifications-outline",
    },
    { name: "Profil", path: "/(app)/profile", icon: "person-outline" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: Colors.backgroundPrimary,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        height: 78,
        paddingTop: 30, // ← ajoute cette ligne
      }}
    >
      {tabs.map((tab) => {
        // Verifie si cet onglet est actif selon l'URL courante
        const isActive =
          pathname === tab.path ||
          (tab.path !== "/(app)" && pathname.startsWith(tab.path));

        return (
          <TouchableOpacity
            key={tab.path}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: isActive ? 2 : 0,
              borderBottomColor: Colors.primary,
            }}
            onPress={() => router.push(tab.path as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={isActive ? Colors.primary : Colors.textTertiary}
            />
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: isActive ? Colors.primary : Colors.textTertiary,
              }}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
export default function AppLayout() {
  console.log("Platform:", Platform.OS);
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
      <OfflineBanner />

      {/* Barre de navigation en haut sur Android */}
      {Platform.OS === "android" && <AndroidTopBar />}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          // Cache la barre du bas sur Android
          tabBarStyle:
            Platform.OS === "android"
              ? { display: "none" }
              : {
                  backgroundColor: Colors.backgroundPrimary,
                  borderTopColor: Colors.border,
                  borderTopWidth: 0.5,
                  height: 60,
                  paddingBottom: 8,
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
