// =====================================================
// tokenService — Gestion des tokens JWT
// Utilise SecureStore sur iOS/Android
// Utilise localStorage sur le web (simulation)
// =====================================================

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "pm_access_token";
const REFRESH_TOKEN_KEY = "pm_refresh_token";

// Verifie si on est sur le web
const isWeb = Platform.OS === "web";

// Fonctions de stockage adaptees selon la plateforme
const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      // Sur le web on utilise localStorage
      localStorage.setItem(key, value);
    } else {
      // Sur iOS/Android on utilise SecureStore
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      return localStorage.getItem(key);
    } else {
      return SecureStore.getItemAsync(key);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const tokenService = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storage.setItem(ACCESS_TOKEN_KEY, accessToken),
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return storage.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return storage.getItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      storage.deleteItem(ACCESS_TOKEN_KEY),
      storage.deleteItem(REFRESH_TOKEN_KEY),
    ]);
  },

  isTokenExpired(token: string): boolean {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  },
};
