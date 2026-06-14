// =====================================================
// AIAssistantScreen — Assistant IA par projet
// Permet de :
// 1. Chatter avec l'IA sur le projet
// 2. Generer des taches automatiquement
// =====================================================

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import { aiApi } from "@/api/ai";
import { Colors } from "@/constants/colors";

// Type pour un message dans le chat IA
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Messages du chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant IA. Je peux vous aider a generer des taches pour ce projet ou repondre a vos questions. Comment puis-je vous aider ?",
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Envoie un message a l'assistant IA
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Ajoute le message de l'utilisateur
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      // Envoie le message a l'API IA
      const response = await aiApi.chat(inputText.trim(), Number(id));

      // Ajoute la reponse de l'IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll automatique vers le bas
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      //   console.log("Erreur IA:", JSON.stringify(error?.response?.data));
      //   console.log("Status:", error?.response?.status);
      Alert.alert("Erreur", "Impossible de contacter l'assistant IA.");
    } finally {
      setIsSending(false);
    }
  };

  // Genere des taches automatiquement via l'IA
  const handleGenerateTasks = async () => {
    Alert.prompt(
      "Generer des taches",
      "Decrivez le projet ou ce que vous voulez accomplir :",
      async (description) => {
        if (!description?.trim()) return;
        setIsGenerating(true);

        try {
          const response = await aiApi.generateTasks(Number(id), description);

          // Affiche les taches generees dans le chat
          const tasksList = response.tasks
            .map((t, i) => `${i + 1}. ${t.title}\n   ${t.description}`)
            .join("\n\n");

          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `J'ai genere ${response.tasks.length} tache(s) pour votre projet :\n\n${tasksList}\n\nCes taches ont ete ajoutees a votre projet.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);

          Alert.alert(
            "Succes",
            `${response.tasks.length} tache(s) generee(s) !`,
          );
        } catch (error) {
          Alert.alert("Erreur", "Impossible de generer les taches.");
        } finally {
          setIsGenerating(false);
        }
      },
      "plain-text",
    );
  };

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
          <Text style={styles.title}>Assistant IA</Text>
          {/* Bouton generer des taches */}
          <TouchableOpacity
            onPress={handleGenerateTasks}
            disabled={isGenerating}
            style={styles.generateButton}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.generateButtonText}>✨ Generer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Liste des messages du chat */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                // Bulle a droite pour l'utilisateur, a gauche pour l'IA
                message.role === "user"
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              {/* Indicateur du role */}
              {message.role === "assistant" && (
                <Text style={styles.roleLabel}>🤖 Assistant</Text>
              )}
              {/* Contenu du message */}
              <Text
                style={[
                  styles.messageText,
                  message.role === "user"
                    ? styles.userText
                    : styles.assistantText,
                ]}
              >
                {message.content}
              </Text>
              {/* Heure du message */}
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}

          {/* Indicateur de saisie de l'IA */}
          {isSending && (
            <View style={styles.assistantBubble}>
              <Text style={styles.roleLabel}>🤖 Assistant</Text>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        </ScrollView>

        {/* Zone de saisie */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Posez une question..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          {/* Bouton envoyer */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>→</Text>
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

  // En-tete
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary + "15",
    borderRadius: 20,
  },
  generateButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },

  // Messages
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    gap: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.backgroundPrimary,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  roleLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#FFFFFF" },
  assistantText: { color: Colors.textPrimary },
  messageTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    alignSelf: "flex-end",
  },

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
});
