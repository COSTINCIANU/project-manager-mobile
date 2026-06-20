// =====================================================
// themeStore — Gestion du theme clair/sombre
// Utilise Zustand pour stocker le theme actuel
// et AsyncStorage pour le sauvegarder entre les sessions
// =====================================================

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cle de stockage du theme dans AsyncStorage
const THEME_KEY = "app_theme";

interface ThemeStore {
  isDark: boolean; // true = theme sombre, false = theme clair
  isLoaded: boolean; // true quand le theme est charge depuis AsyncStorage
  toggleTheme: () => void; // Bascule entre clair et sombre
  loadTheme: () => void; // Charge le theme sauvegarde au demarrage
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: false,
  isLoaded: false,

  // Charge le theme depuis AsyncStorage au demarrage de l'app
  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved !== null) {
        // L'utilisateur a deja fait un choix manuel — on le respecte
        set({ isDark: saved === "dark", isLoaded: true });
      } else {
        // Pas de choix manuel — suit le theme systeme
        const { Appearance } = require("react-native");
        const systemIsDark = Appearance.getColorScheme() === "dark";
        set({ isDark: systemIsDark, isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  // Bascule entre theme clair et sombre et sauvegarde le choix
  toggleTheme: async () => {
    const newIsDark = !get().isDark;
    set({ isDark: newIsDark });
    try {
      // Sauvegarde le theme choisi pour le retrouver au prochain demarrage
      await AsyncStorage.setItem(THEME_KEY, newIsDark ? "dark" : "light");
    } catch (error) {
      console.log("Erreur sauvegarde theme:", error);
    }
  },
}));
