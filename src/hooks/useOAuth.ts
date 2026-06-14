// =====================================================
// useOAuth — Hook pour l'authentification OAuth
// Gere le flux OAuth Google et GitHub sur mobile
// via expo-auth-session (navigateur integre)
// =====================================================

import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useAuthStore } from "@/stores/authStore";
import { oauthApi } from "@/api/oauth";
import { authApi } from "@/api/auth";
import { tokenService } from "@/services/tokenService";

// Necessaire pour fermer le navigateur OAuth apres le callback
WebBrowser.maybeCompleteAuthSession();

// URLs de callback OAuth — doivent correspondre a celles
// configurees dans Google Console et GitHub OAuth App
// const REDIRECT_URI = AuthSession.makeRedirectUri({
//   scheme: "projectmanager",
//   path: "auth",
// });

const REDIRECT_URI = AuthSession.makeRedirectUri();

export function useGoogleOAuth() {
  const { setUser } = useAuthStore();

  // Configuration de la requete OAuth Google
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId:
        "359683885190-9hi34n86k37nqg8j5asakcvu2ip1pes3.apps.googleusercontent.com",
      scopes: ["openid", "profile", "email"],
      redirectUri: REDIRECT_URI,
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    },
  );

  // Traite la reponse OAuth quand l'utilisateur revient
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      handleGoogleCode(code);
    }
  }, [response]);

  // Echange le code contre un JWT Symfony
  const handleGoogleCode = async (code: string) => {
    try {
      const tokens = await oauthApi.loginWithGoogle(code);
      await tokenService.saveTokens(tokens.token, tokens.refresh_token);
      const user = await authApi.getProfile();
      setUser(user);
    } catch (error) {
      console.log("Erreur OAuth Google:", error);
    }
  };

  return {
    // Lance le navigateur OAuth Google
    signInWithGoogle: () => promptAsync(),
    isReady: !!request,
  };
}

export function useGithubOAuth() {
  const { setUser } = useAuthStore();

  // Configuration de la requete OAuth GitHub
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: "Ov23li49pQqb8JVThVFZ", // A remplacer par ton Client ID GitHub
      scopes: ["user:email"],
      redirectUri: REDIRECT_URI,
    },
    {
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
    },
  );

  // Traite la reponse OAuth quand l'utilisateur revient
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      handleGithubCode(code);
    }
  }, [response]);

  // Echange le code contre un JWT Symfony
  const handleGithubCode = async (code: string) => {
    try {
      const tokens = await oauthApi.loginWithGithub(code);
      await tokenService.saveTokens(tokens.token, tokens.refresh_token);
      const user = await authApi.getProfile();
      setUser(user);
    } catch (error) {
      console.log("Erreur OAuth GitHub:", error);
    }
  };

  return {
    // Lance le navigateur OAuth GitHub
    signInWithGithub: () => promptAsync(),
    isReady: !!request,
  };
}
