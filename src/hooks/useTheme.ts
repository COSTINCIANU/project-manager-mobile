// =====================================================
// useTheme — Hook pour acceder aux couleurs du theme
// Suit automatiquement le theme systeme iOS/Android
// Le bouton dans l'app force un theme specifique
// =====================================================

import { useColorScheme } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { LightTheme, DarkTheme } from "@/constants/theme";

export function useTheme() {
  // Theme systeme iOS/Android — se met a jour automatiquement
  const systemScheme = useColorScheme();
  // Theme manuel choisi via le bouton dans l'app
  const { isDark: manualIsDark, toggleTheme, isLoaded } = useThemeStore();

  // isDark = theme manuel si charge, sinon theme systeme
  const isDark = manualIsDark;

  // Re-rendu automatique quand le systeme change
  // en combinant les deux sources
  const effectiveIsDark = isLoaded ? manualIsDark : systemScheme === "dark";

  return {
    theme: effectiveIsDark ? DarkTheme : LightTheme,
    isDark: effectiveIsDark,
    toggleTheme,
  };
}
