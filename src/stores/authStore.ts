// =====================================================
// authStore — Store Zustand pour l'authentification
// Gere l'etat de connexion, le token JWT et Mercure
// =====================================================

import { create } from "zustand";
import { tokenService } from "@/services/tokenService";
import { mercureService } from "@/services/mercureService";
import { authApi } from "@/api/auth";
import { User } from "@/types/user";
import { LoginPayload } from "@/types/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  tempToken: string | null;
  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  requiresTwoFactor: false,
  tempToken: null,

  // Verifie si un token existe au demarrage de l'app
  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenService.getAccessToken();
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await authApi.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
      // Connexion Mercure si deja connecte
      mercureService.connect(user.id);
    } catch {
      await tokenService.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Connexion avec email + mot de passe
  login: async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    // console.log("Resultat API:", JSON.stringify(result));
    if (result.requiresTwoFactor && result.tempToken) {
      set({ requiresTwoFactor: true, tempToken: result.tempToken });
      return;
    }
    // L'API retourne token mais pas refresh_token
    // On sauvegarde une string vide si refresh_token est absent
    // await tokenService.saveTokens(result.token, result.refresh_token ?? "");

    // On sauvegarde le JWT + le refresh token retournes par l'API
    await tokenService.saveTokens(result.token, result.refreshToken ?? "");
    const user = await authApi.getProfile();
    // Met a jour le store
    set({
      user,
      isAuthenticated: true,
      requiresTwoFactor: false,
      tempToken: null,
    });
    // Connexion Mercure apres login
    mercureService.connect(user.id);
  },

  // Deconnexion
  logout: async () => {
    // Deconnexion Mercure
    mercureService.disconnect();
    await tokenService.clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      requiresTwoFactor: false,
      tempToken: null,
    });
  },

  setUser: (user: User) => set({ user }),
}));
