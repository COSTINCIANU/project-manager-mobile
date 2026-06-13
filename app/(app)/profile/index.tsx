import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { Colors } from "@/constants/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Profil</Text>
        {user && <Text style={styles.email}>{user.email}</Text>}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundPrimary },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: Colors.textPrimary },
  email: { fontSize: 15, color: Colors.textSecondary },
  logoutButton: {
    marginTop: 16,
    height: 48,
    paddingHorizontal: 32,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
});
