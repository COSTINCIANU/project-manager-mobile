// =====================================================
// AppLayout Android — Layout principal pour Android
// Navigation adaptee pour Android :
// - Barre de navigation en HAUT (pas en bas comme iOS)
// - Tient compte de la barre systeme Android en bas
// =====================================================

import { useEffect } from "react";
import { View, Platform } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

export default function AppLayoutAndroid() {
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
      {/* Banniere offline */}
      <OfflineBanner />

      <Tabs
        tabBar={(props) => <AndroidTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
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

// =====================================================
// AndroidTabBar — Barre de navigation personnalisee
// Affichee EN HAUT de l'ecran sur Android
// pour ne pas entrer en conflit avec la barre systeme
// =====================================================
function AndroidTabBar({ state, descriptors, navigation }: any) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: Colors.backgroundPrimary,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        height: 56,
        // Positionnee en haut — pas en bas
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === index;

        // Icone de l'onglet
        const icon = options.tabBarIcon?.({
          color: isFocused ? Colors.primary : Colors.textTertiary,
          size: 22,
          focused: isFocused,
        });

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <View
            key={route.key}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              // Indicateur actif en bas de l'onglet
              borderBottomWidth: isFocused ? 2 : 0,
              borderBottomColor: Colors.primary,
            }}
            onTouchEnd={onPress}
          >
            {icon}
            <View style={{ height: 2 }} />
          </View>
        );
      })}
    </View>
  );
}
