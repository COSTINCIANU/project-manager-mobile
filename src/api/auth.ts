import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/constants/api";
import { LoginPayload, AuthTokens, TwoFactorPayload } from "@/types/auth";
import { User } from "@/types/user";

export const authApi = {
  async login(
    payload: LoginPayload
  ): Promise<AuthTokens & { requiresTwoFactor?: boolean; tempToken?: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.LOGIN, {
      email: payload.username,
      password: payload.password,
    });
    // console.log("API login data:", JSON.stringify(data));
    return data;
  },

  async verifyTwoFactor(payload: TwoFactorPayload): Promise<AuthTokens> {
    const { data } = await apiClient.post(API_ENDPOINTS.VERIFY_2FA, payload);
    return data;
  },

  async getProfile(): Promise<User> {
    const { data } = await apiClient.get(API_ENDPOINTS.PROFILE);
    console.log("Profil utilisateur:", JSON.stringify(data));
    return data;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post(API_ENDPOINTS.REFRESH, {
      // refresh_token: refreshToken,
      refreshToken: refreshToken, // ✅ camelCase
    });
    return data;
  },
};
