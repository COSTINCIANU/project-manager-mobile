// =====================================================
// ChatScreen — Chat du projet
// Affiche les messages en temps reel
// Permet d'envoyer et supprimer des messages
// Note : temps reel via Mercure disponible en dev build
// Theme clair/sombre automatique selon le systeme
// Sur tablette : bulles plus larges et zone centree
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
import { useBreakpoint } from "@/hooks/useBreakpoint";

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
  // Recupere l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Recupere l'utilisateur connecte pour identifier ses messages
  const { user } = useAuthStore();
  // Reference vers la FlatList pour scroller vers le bas
  const flatListRef = useRef<FlatList>(null);
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  // ETATS
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Charge les messages au demarrage
  useEffect(() => {
    loadMessages();
  }, [id]);

  // Charge les messages depuis l'API
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

  // Envoie un nouveau message
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
      // Ajoute le message a la liste et scroll vers le bas
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

  // Supprime un message avec confirmation
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

  // Verifie si le message appartient a l'utilisateur connecte
  const isMyMessage = (message: ChatMessage) => message.senderEmail === user?.email;

  // Formate l'heure d'un message
  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.primary }]}>← Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Chat</Text>
          {/* Bouton rafraichir les messages */}
          <TouchableOpacity onPress={loadMessages} style={styles.refreshButton}>
            <Text style={[styles.refreshText, { color: theme.primary }]}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Zone principale — centree sur tablette */}
        <View style={[styles.mainArea, isTablet && styles.mainAreaTablet]}>
          {/* Liste des messages */}
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyText, { color: theme.textPrimary }]}>Aucun message</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Soyez le premier a envoyer un message !
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              // Plus de padding sur tablette
              contentContainerStyle={[styles.messagesList, isTablet && styles.messagesListTablet]}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              renderItem={({ item }) => {
                const mine = isMyMessage(item);
                return (
                  // Appui long pour supprimer son propre message
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
                      {/* Bulle de message — plus large sur tablette */}
                      <View
                        style={[
                          styles.messageBubble,
                          // Bulle plus large sur tablette
                          isTablet && styles.messageBubbleTablet,
                          mine
                            ? [styles.myBubble, { backgroundColor: theme.primary }]
                            : [
                                styles.theirBubble,
                                {
                                  backgroundColor: theme.backgroundPrimary,
                                  borderColor: theme.border,
                                },
                              ],
                        ]}
                      >
                        {/* Nom de l'auteur pour les messages des autres */}
                        {!mine && (
                          <Text style={[styles.authorName, { color: theme.textTertiary }]}>
                            {item.senderName ?? item.senderEmail}
                          </Text>
                        )}
                        {/* Contenu du message */}
                        <Text
                          style={[
                            styles.messageText,
                            mine
                              ? styles.myMessageText
                              : [styles.theirMessageText, { color: theme.textPrimary }],
                          ]}
                        >
                          {item.content}
                        </Text>
                        {/* Heure du message */}
                        <Text
                          style={[
                            styles.messageTime,
                            mine
                              ? styles.myMessageTime
                              : [styles.theirMessageTime, { color: theme.textTertiary }],
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

          {/* Zone de saisie du message */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.backgroundPrimary,
                borderTopColor: theme.border,
              },
              // Padding supplementaire sur tablette
              isTablet && styles.inputContainerTablet,
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
            {/* Bouton envoyer */}
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
        </View>
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

  // Zone principale — pleine largeur sur mobile
  mainArea: { flex: 1 },
  // Zone principale — centree avec largeur max sur tablette
  mainAreaTablet: { maxWidth: 800, alignSelf: "center", width: "100%" },

  // Liste des messages
  messagesList: { padding: 16, gap: 8 },
  // Plus de padding sur tablette
  messagesListTablet: { padding: 24, gap: 12 },

  messageRow: { marginBottom: 8 },
  myMessageRow: { alignItems: "flex-end" },
  theirMessageRow: { alignItems: "flex-start" },

  // Bulle de message — 75% sur mobile
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16, gap: 4 },
  // Bulle plus large sur tablette
  messageBubbleTablet: { maxWidth: "60%" },

  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4, borderWidth: 0.5 },
  authorName: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  messageText: { fontSize: 14, lineHeight: 20 },
  myMessageText: { color: "#FFFFFF" },
  theirMessageText: {},
  messageTime: { fontSize: 10, alignSelf: "flex-end" },
  myMessageTime: { color: "rgba(255,255,255,0.7)" },
  theirMessageTime: {},

  // Zone de saisie
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
  },
  // Padding supplementaire sur tablette
  inputContainerTablet: { padding: 16, gap: 12 },

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

  // Etat vide
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
