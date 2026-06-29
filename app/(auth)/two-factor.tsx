import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/auth";
import { tokenService } from "@/services/tokenService";
import { Colors } from "@/constants/colors";

export default function TwoFactorScreen() {
  const router = useRouter();
  const { tempToken, setUser } = useAuthStore();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      Alert.alert("Code invalide", "Le code doit contenir 6 chiffres.");
      return;
    }
    if (!tempToken) {
      Alert.alert("Erreur", "Session expirée. Veuillez vous reconnecter.");
      router.replace("/(auth)/login");
      return;
    }
    setIsLoading(true);
    try {
      const tokens = await authApi.verifyTwoFactor({
        code: code.trim(),
        tempToken,
      });
      await tokenService.saveTokens(tokens.token, tokens.refresh_token);
      const user = await authApi.getProfile();
      setUser(user);
      router.replace("/(app)");
    } catch {
      Alert.alert("Code incorrect", "Vérifiez le code reçu par email et réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Vérification</Text>
        <Text style={styles.subtitle}>
          Un code à 6 chiffres a été envoyé à votre adresse email.
        </Text>
        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor={Colors.textTertiary}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Vérifier</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundPrimary },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 20 },
  title: { fontSize: 28, fontWeight: "700", color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  codeInput: {
    height: 64,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: 12,
    backgroundColor: Colors.backgroundSecondary,
  },
  button: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  backText: { fontSize: 14, color: Colors.textSecondary, textAlign: "center" },
});
