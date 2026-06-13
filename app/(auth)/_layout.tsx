import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/(app)");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="two-factor" />
    </Stack>
  );
}
