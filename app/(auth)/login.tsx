// =====================================================
// LoginScreen — Ecran de connexion
// Supporte : email/mot de passe, OAuth Google, GitHub
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
import { Colors } from "@/constants/colors";
import { useGoogleOAuth, useGithubOAuth } from "@/hooks/useOAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { login, requiresTwoFactor } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hooks OAuth
  const { signInWithGoogle, isReady: googleReady } = useGoogleOAuth();
  const { signInWithGithub, isReady: githubReady } = useGithubOAuth();

  const handleLogin = async () => {
    console.log("handleLogin appelé Android", email, password);
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
      console.log("Erreur complète:", JSON.stringify(error));
      console.log("Message:", error?.message);
      console.log("Code:", error?.code);

      const message =
        error?.response?.data?.message ?? "Email ou mot de passe incorrect.";
      Alert.alert("Connexion impossible", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* En-tete */}
          <View style={styles.header}>
            <Text style={styles.title}>Project Manager</Text>
            <Text style={styles.subtitle}>Connectez-vous a votre espace</Text>
          </View>

          {/* Boutons OAuth */}
          <View style={styles.oauthSection}>
            {/* Bouton Google */}
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={signInWithGoogle}
              disabled={!googleReady}
              activeOpacity={0.7}
            >
              <Text style={styles.oauthIcon}>G</Text>
              <Text style={styles.oauthText}>Continuer avec Google</Text>
            </TouchableOpacity>

            {/* Bouton GitHub */}
            <TouchableOpacity
              style={styles.oauthButton}
              onPress={signInWithGithub}
              disabled={!githubReady}
              activeOpacity={0.7}
            >
              <Text style={styles.oauthIcon}>⌥</Text>
              <Text style={styles.oauthText}>Continuer avec GitHub</Text>
            </TouchableOpacity>
          </View>

          {/* Separateur */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Formulaire email/mdp */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                autoComplete="current-password"
              />
            </View>

            <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
              Mot de passe oublie ?
            </Link>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
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
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <Link href="/(auth)/register" style={styles.footerLink}>
              Creer un compte
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundPrimary },
  inner: { flex: 1, paddingHorizontal: 24 },

  // En-tete
  header: { marginTop: 40, marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: Colors.textSecondary },

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
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  oauthIcon: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  oauthText: { fontSize: 15, fontWeight: "500", color: Colors.textPrimary },

  // Separateur
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  separatorLine: { flex: 1, height: 0.5, backgroundColor: Colors.border },
  separatorText: { fontSize: 13, color: Colors.textTertiary },

  // Formulaire
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
  },
  forgotLink: { fontSize: 14, color: Colors.primary, textAlign: "right" },
  button: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },

  // Pied de page
  footer: { flexDirection: "row", justifyContent: "center", marginBottom: 32 },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: "500" },
});
