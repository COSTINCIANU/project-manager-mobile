// =====================================================
// ChatScreen — Chat du projet
// Affiche les messages en temps reel
// Permet d'envoyer et supprimer des messages
// Note : temps reel via Mercure disponible en dev build
// Theme clair/sombre automatique selon le systeme
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";

// Type pour un message de chat
interface ChatMessage {
  id: number;
  content: string;
  senderEmail: string;
  senderName: string;
  projectId: number;
  createdAt: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [id]);

  const loadMessages = async () => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CHAT);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Erreur chargement chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.CHAT, {
        content: messageText,
        projectId: Number(id),
      });
      setMessages((prev) => [...prev, data]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'envoyer le message.");
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (messageId: number) => {
    Alert.alert("Supprimer", "Voulez-vous supprimer ce message ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(API_ENDPOINTS.CHAT_DELETE(messageId));
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer le message.");
          }
        },
      },
    ]);
  };

  const isMyMessage = (message: ChatMessage) =>
    message.senderEmail === user?.email;
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* En-tete */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.backgroundPrimary,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: theme.primary }]}>
              ← Retour
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Chat</Text>
          <TouchableOpacity onPress={loadMessages} style={styles.refreshButton}>
            <Text style={[styles.refreshText, { color: theme.primary }]}>
              ↻
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyText, { color: theme.textPrimary }]}>
              Aucun message
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Soyez le premier a envoyer un message !
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            renderItem={({ item }) => {
              const mine = isMyMessage(item);
              return (
                <TouchableOpacity
                  onLongPress={() => mine && handleDelete(item.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.messageRow,
                      mine ? styles.myMessageRow : styles.theirMessageRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        mine
                          ? [
                              styles.myBubble,
                              { backgroundColor: theme.primary },
                            ]
                          : [
                              styles.theirBubble,
                              {
                                backgroundColor: theme.backgroundPrimary,
                                borderColor: theme.border,
                              },
                            ],
                      ]}
                    >
                      {!mine && (
                        <Text
                          style={[
                            styles.authorName,
                            { color: theme.textTertiary },
                          ]}
                        >
                          {item.senderName ?? item.senderEmail}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.messageText,
                          mine
                            ? styles.myMessageText
                            : [
                                styles.theirMessageText,
                                { color: theme.textPrimary },
                              ],
                        ]}
                      >
                        {item.content}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          mine
                            ? styles.myMessageTime
                            : [
                                styles.theirMessageTime,
                                { color: theme.textTertiary },
                              ],
                        ]}
                      >
                        {formatTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Zone de saisie */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.backgroundPrimary,
              borderTopColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.textPrimary,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            placeholder="Ecrire un message..."
            placeholderTextColor={theme.textTertiary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================
// STYLES — valeurs fixes uniquement
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 18, fontWeight: "600", flex: 1, marginLeft: 12 },
  refreshButton: { padding: 8 },
  refreshText: { fontSize: 20 },
  messagesList: { padding: 16, gap: 8 },
  messageRow: { marginBottom: 8 },
  myMessageRow: { alignItems: "flex-end" },
  theirMessageRow: { alignItems: "flex-start" },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, gap: 4 },
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4, borderWidth: 0.5 },
  authorName: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  messageText: { fontSize: 14, lineHeight: 20 },
  myMessageText: { color: "#FFFFFF" },
  theirMessageText: {},
  messageTime: { fontSize: 10, alignSelf: "flex-end" },
  myMessageTime: { color: "rgba(255,255,255,0.7)" },
  theirMessageTime: {},
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: "600" },
  emptySubtext: { fontSize: 14, textAlign: "center" },
});
