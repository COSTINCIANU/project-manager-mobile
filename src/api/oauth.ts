// =====================================================
// oauthApi — Authentification OAuth Google et GitHub
// Echange le code OAuth contre un token JWT Symfony
// =====================================================

import { apiClient } from "./client";

export const oauthApi = {
  /**
   * Echange le code Google contre un JWT Symfony.
   * Appele apres le callback OAuth Google.
   */
  async loginWithGoogle(
    code: string,
  ): Promise<{ token: string; refresh_token: string }> {
    const { data } = await apiClient.post("/api/auth/google/mobile", { code });
    return data;
  },

  /**
   * Echange le code GitHub contre un JWT Symfony.
   * Appele apres le callback OAuth GitHub.
   */
  async loginWithGithub(
    code: string,
  ): Promise<{ token: string; refresh_token: string }> {
    const { data } = await apiClient.post("/api/auth/github/mobile", { code });
    return data;
  },
};
