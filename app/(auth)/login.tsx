// =====================================================
// LoginScreen — Ecran de connexion
// Supporte : email/mot de passe, OAuth Google, GitHub
// Theme clair/sombre automatique selon le systeme
// =====================================================

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { useGoogleOAuth, useGithubOAuth } from "@/hooks/useOAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { login, requiresTwoFactor } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hook theme — retourne les couleurs selon le mode clair/sombre
  const { theme } = useTheme();

  // Hooks OAuth
  const { signInWithGoogle, isReady: googleReady } = useGoogleOAuth();
  const { signInWithGithub, isReady: githubReady } = useGithubOAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Champs requis",
        "Veuillez remplir votre email et mot de passe.",
      );
      return;
    }
    setIsLoading(true);
    try {
      await login({ username: email.trim(), password });
      if (requiresTwoFactor) {
        router.push("/(auth)/two-factor");
      } else {
        router.replace("/(app)");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Email ou mot de passe incorrect.";
      Alert.alert("Connexion impossible", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}
    >
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* En-tete */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Project Manager
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Connectez-vous a votre espace
            </Text>
          </View>

          {/* Boutons OAuth */}
          <View style={styles.oauthSection}>
            {/* Bouton Google */}
            <TouchableOpacity
              style={[
                styles.oauthButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
              onPress={signInWithGoogle}
              disabled={!googleReady}
              activeOpacity={0.7}
            >
              <Text style={[styles.oauthIcon, { color: theme.textPrimary }]}>
                G
              </Text>
              <Text style={[styles.oauthText, { color: theme.textPrimary }]}>
                Continuer avec Google
              </Text>
            </TouchableOpacity>

            {/* Bouton GitHub */}
            <TouchableOpacity
              style={[
                styles.oauthButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
              onPress={signInWithGithub}
              disabled={!githubReady}
              activeOpacity={0.7}
            >
              <Text style={[styles.oauthIcon, { color: theme.textPrimary }]}>
                ⌥
              </Text>
              <Text style={[styles.oauthText, { color: theme.textPrimary }]}>
                Continuer avec GitHub
              </Text>
            </TouchableOpacity>
          </View>

          {/* Separateur */}
          <View style={styles.separator}>
            <View
              style={[styles.separatorLine, { backgroundColor: theme.border }]}
            />
            <Text style={[styles.separatorText, { color: theme.textTertiary }]}>
              ou
            </Text>
            <View
              style={[styles.separatorLine, { backgroundColor: theme.border }]}
            />
          </View>

          {/* Formulaire email/mdp */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Email
              </Text>
              {/* testID="email-input" — utilisé par les tests Maestro */}
              <TextInput
                testID="email-input"
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                placeholder="votre@email.com"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>
                Mot de passe
              </Text>
              {/* testID="password-input" — utilisé par les tests Maestro */}
              <TextInput
                testID="password-input"
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backgroundColor: theme.backgroundSecondary,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
              />
            </View>

            <Link
              href="/(auth)/forgot-password"
              style={[styles.forgotLink, { color: theme.primary }]}
            >
              Mot de passe oublie ?
            </Link>

            {/* testID="login-button" — utilisé par les tests Maestro */}
            <TouchableOpacity
              testID="login-button"
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Lien inscription */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Pas encore de compte ?{" "}
            </Text>
            <Link
              href="/(auth)/register"
              style={[styles.footerLink, { color: theme.primary }]}
            >
              Creer un compte
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================
// STYLES — valeurs fixes uniquement
// Les couleurs sont appliquees dynamiquement via theme
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },

  // En-tete
  header: { marginTop: 40, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16 },

  // OAuth
  oauthSection: { gap: 12, marginBottom: 24 },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
  },
  oauthIcon: { fontSize: 18, fontWeight: "700" },
  oauthText: { fontSize: 15, fontWeight: "500" },

  // Separateur
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  separatorLine: { flex: 1, height: 0.5 },
  separatorText: { fontSize: 13 },

  // Formulaire
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  forgotLink: { fontSize: 14, textAlign: "right" },
  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },

  // Pied de page
  footer: { flexDirection: "row", justifyContent: "center", marginBottom: 32 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "500" },
});
