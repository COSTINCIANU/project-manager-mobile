// =====================================================
// AppLayout — Layout principal avec tabs
// Gere iOS et Android dans un seul fichier
// Sur Android : navigation en HAUT de l'ecran
// Sur iOS : navigation en BAS de l'ecran
// Theme clair/sombre automatique selon le systeme
// =====================================================

import { useEffect } from "react";
import { Tabs, useRouter, usePathname } from "expo-router";
import { View, Platform, TouchableOpacity, Text } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { useTheme } from "@/hooks/useTheme";
import { Appearance } from "react-native";
import { useThemeStore } from "@/stores/themeStore";

// =====================================================
// AndroidTopBar — Barre de navigation en haut
// Utilise usePathname pour detecter l'onglet actif
// et useRouter pour naviguer entre les onglets
// =====================================================
function AndroidTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

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
        backgroundColor: theme.backgroundPrimary,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.border,
        height: 78,
        paddingTop: 30,
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
              borderBottomColor: theme.primary,
            }}
            onPress={() => router.push(tab.path as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={isActive ? theme.primary : theme.textTertiary}
            />
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: isActive ? theme.primary : theme.textTertiary,
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
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated) return null;

  // Ecoute les changements de theme systeme en temps reel
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Met a jour le store quand le theme systeme change
      useThemeStore.setState({ isDark: colorScheme === "dark" });
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundTertiary }}>
      {/* Banniere offline */}
      <OfflineBanner />

      {/* Barre de navigation en haut sur Android */}
      {Platform.OS === "android" && <AndroidTopBar />}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textTertiary,
          // Cache les labels pour afficher seulement les icones
          tabBarShowLabel: false,
          // Cache la barre du bas sur Android
          tabBarStyle:
            Platform.OS === "android"
              ? { display: "none" }
              : {
                  backgroundColor: theme.backgroundPrimary,
                  borderTopColor: theme.border,
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
