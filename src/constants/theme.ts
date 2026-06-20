// =====================================================
// theme.ts — Couleurs adaptees au theme clair/sombre
// Utilise les couleurs definies dans colors.ts
// et retourne le bon jeu de couleurs selon le theme
// =====================================================

import { Colors } from "./colors";

// Couleurs pour le theme CLAIR
export const LightTheme = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,

  // Fonds clairs
  backgroundPrimary: Colors.backgroundPrimary,
  backgroundSecondary: Colors.backgroundSecondary,
  backgroundTertiary: Colors.backgroundTertiary,

  // Textes sombres sur fond clair
  textPrimary: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textTertiary: Colors.textTertiary,

  // Bordures claires
  border: Colors.border,

  // Priorites
  priorityLow: Colors.priorityLow,
  priorityMedium: Colors.priorityMedium,
  priorityHigh: Colors.priorityHigh,
  priorityCritical: Colors.priorityCritical,
};

// Couleurs pour le theme SOMBRE
export const DarkTheme = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,

  // Fonds sombres
  backgroundPrimary: Colors.darkBackgroundPrimary,
  backgroundSecondary: Colors.darkBackgroundSecondary,
  backgroundTertiary: Colors.darkBackgroundTertiary,

  // Textes clairs sur fond sombre
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#64748B",

  // Bordures sombres
  border: Colors.borderDark,

  // Priorites — identiques dans les deux themes
  priorityLow: Colors.priorityLow,
  priorityMedium: Colors.priorityMedium,
  priorityHigh: Colors.priorityHigh,
  priorityCritical: Colors.priorityCritical,
};

// Type du theme — permet a TypeScript de valider les couleurs utilisees
export type Theme = typeof LightTheme;
