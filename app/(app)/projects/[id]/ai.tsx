// =====================================================
// AIAssistantScreen — Assistant IA par projet
// Permet de :
// 1. Chatter avec l'IA sur le projet
// 2. Generer des taches automatiquement
// Theme clair/sombre automatique selon le systeme
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
import { useTheme } from "@/hooks/useTheme";

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
  // Hook theme pour les couleurs adaptees
  const { theme } = useTheme();

  // Messages du chat — message de bienvenue initial
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

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      const response = await aiApi.chat(inputText.trim(), Number(id));
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Assistant IA
          </Text>
          <TouchableOpacity
            onPress={handleGenerateTasks}
            disabled={isGenerating}
            style={[
              styles.generateButton,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text
                style={[styles.generateButtonText, { color: theme.primary }]}
              >
                ✨ Generer
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Liste des messages */}
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
                message.role === "user"
                  ? [styles.userBubble, { backgroundColor: theme.primary }]
                  : [
                      styles.assistantBubble,
                      {
                        backgroundColor: theme.backgroundPrimary,
                        borderColor: theme.border,
                      },
                    ],
              ]}
            >
              {/* Label role pour l'assistant */}
              {message.role === "assistant" && (
                <Text style={[styles.roleLabel, { color: theme.textTertiary }]}>
                  🤖 Assistant
                </Text>
              )}
              {/* Contenu du message */}
              <Text
                style={[
                  styles.messageText,
                  message.role === "user"
                    ? styles.userText
                    : [styles.assistantText, { color: theme.textPrimary }],
                ]}
              >
                {message.content}
              </Text>
              {/* Heure */}
              <Text
                style={[
                  styles.messageTime,
                  {
                    color:
                      message.role === "user"
                        ? "rgba(255,255,255,0.7)"
                        : theme.textTertiary,
                  },
                ]}
              >
                {message.timestamp.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}

          {/* Indicateur de frappe */}
          {isSending && (
            <View
              style={[
                styles.assistantBubble,
                {
                  backgroundColor: theme.backgroundPrimary,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.roleLabel, { color: theme.textTertiary }]}>
                🤖 Assistant
              </Text>
              <ActivityIndicator color={theme.primary} />
            </View>
          )}
        </ScrollView>

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
            placeholder="Posez une question..."
            placeholderTextColor={theme.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary },
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
// STYLES — valeurs fixes uniquement
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 15 },
  title: { fontSize: 18, fontWeight: "600", flex: 1 },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  generateButtonText: { fontSize: 13, fontWeight: "500" },
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 16, gap: 4 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
  },
  roleLabel: { fontSize: 11, marginBottom: 2 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#FFFFFF" },
  assistantText: {},
  messageTime: { fontSize: 10, alignSelf: "flex-end" },
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
});
