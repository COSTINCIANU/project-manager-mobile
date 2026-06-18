// =====================================================
// ChatScreen — Chat du projet
// Affiche les messages en temps reel
// Permet d'envoyer et supprimer des messages
// Note : temps reel via Mercure disponible en dev build
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
import { Colors } from "@/constants/colors";

// Type pour un message de chat
interface ChatMessage {
  id: number;
  content: string;
  author: {
    id: number;
    email: string;
    name: string | null;
  };
  projectId: number;
  createdAt: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  // Etats
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
      // Filtre les messages par projet
      const projectMessages = Array.isArray(data)
        ? data.filter((m: ChatMessage) => m.projectId === Number(id))
        : [];
      setMessages(projectMessages);
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
      // Ajoute le message a la liste
      setMessages((prev) => [...prev, data]);
      // Scroll vers le bas
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.log("Erreur envoi message:", error);
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
  const isMyMessage = (message: ChatMessage) => {
    return message.author?.email === user?.email;
  };

  // Formate l'heure d'un message
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* En-tete */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Chat</Text>
          {/* Bouton rafraichir */}
          <TouchableOpacity onPress={loadMessages} style={styles.refreshButton}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des messages */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Aucun message</Text>
            <Text style={styles.emptySubtext}>
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
                    {/* Bulle de message */}
                    <View
                      style={[
                        styles.messageBubble,
                        mine ? styles.myBubble : styles.theirBubble,
                      ]}
                    >
                      {/* Nom de l'auteur pour les messages des autres */}
                      {!mine && (
                        <Text style={styles.authorName}>
                          {item.author?.name ?? item.author?.email}
                        </Text>
                      )}
                      {/* Contenu du message */}
                      <Text
                        style={[
                          styles.messageText,
                          mine ? styles.myMessageText : styles.theirMessageText,
                        ]}
                      >
                        {item.content}
                      </Text>
                      {/* Heure du message */}
                      <Text
                        style={[
                          styles.messageTime,
                          mine ? styles.myMessageTime : styles.theirMessageTime,
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ecrire un message..."
            placeholderTextColor={Colors.textTertiary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          {/* Bouton envoyer */}
          <TouchableOpacity
            style={[
              styles.sendButton,
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
// STYLES
// =====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundTertiary },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // En-tete
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15, color: Colors.primary },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  refreshButton: { padding: 8 },
  refreshText: { fontSize: 20, color: Colors.primary },

  // Messages
  messagesList: { padding: 16, gap: 8 },
  messageRow: { marginBottom: 8 },
  myMessageRow: { alignItems: "flex-end" },
  theirMessageRow: { alignItems: "flex-start" },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.backgroundPrimary,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  authorName: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  myMessageText: { color: "#FFFFFF" },
  theirMessageText: { color: Colors.textPrimary },
  messageTime: { fontSize: 10, alignSelf: "flex-end" },
  myMessageTime: { color: "rgba(255,255,255,0.7)" },
  theirMessageTime: { color: Colors.textTertiary },

  // Zone saisie
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    backgroundColor: Colors.backgroundPrimary,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundSecondary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
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
  emptyText: { fontSize: 18, fontWeight: "600", color: Colors.textPrimary },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
