import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "pm_access_token";
const REFRESH_TOKEN_KEY = "pm_refresh_token";

export const tokenService = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
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
