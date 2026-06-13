import { create } from "zustand";
import { tokenService } from "@/services/tokenService";
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
    } catch {
      await tokenService.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    console.log("Résultat API login:", JSON.stringify(result));
    if (result.requiresTwoFactor && result.tempToken) {
      set({ requiresTwoFactor: true, tempToken: result.tempToken });
      return;
    }
    await tokenService.saveTokens(result.token, result.refresh_token);
    const user = await authApi.getProfile();
    set({
      user,
      isAuthenticated: true,
      requiresTwoFactor: false,
      tempToken: null,
    });
  },

  logout: async () => {
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
