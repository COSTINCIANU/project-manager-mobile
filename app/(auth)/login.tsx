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
} from "react-native";
import { useRouter, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";
import { API_BASE_URL } from "@/constants/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login, requiresTwoFactor } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log("handleLogin appelé", email, password);
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Champs requis",
        "Veuillez remplir votre email et mot de passe.",
      );
      return;
    }
    setIsLoading(true);
    try {
      console.log("Appel API...", API_BASE_URL);
      await login({ username: email.trim(), password });
      if (requiresTwoFactor) {
        router.push("/(auth)/two-factor");
      } else {
        router.replace("/(app)");
      }
    } catch (error: any) {
      console.log("Status:", error?.response?.status);
      console.log("Data:", JSON.stringify(error?.response?.data));
      console.log("Message:", error?.message);
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
        <View style={styles.header}>
          <Text style={styles.title}>Project Manager</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>
        </View>

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
            Mot de passe oublié ?
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/(auth)/register" style={styles.footerLink}>
            Créer un compte
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundPrimary },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { marginBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: Colors.textSecondary },
  form: { gap: 16 },
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
  forgotLink: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: "right",
    marginTop: -4,
  },
  button: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: "500" },
});
