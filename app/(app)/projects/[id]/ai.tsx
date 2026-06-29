// =====================================================
// AIAssistantScreen — Assistant IA par projet
// Permet de :
// 1. Chatter avec l'IA sur le projet
// 2. Generer des taches automatiquement
// Theme clair/sombre automatique selon le systeme
// Sur tablette : zone de chat centree avec largeur max
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
import { useBreakpoint } from "@/hooks/useBreakpoint";

// Type pour un message dans le chat IA
interface ChatMessage {
  id: string;
  role: "user" | "assistant"; // "user" = utilisateur, "assistant" = IA
  content: string;
  timestamp: Date;
}

export default function AIAssistantScreen() {
  // Recupere l'ID du projet depuis l'URL
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // Reference vers le ScrollView pour scroller vers le bas automatiquement
  const scrollViewRef = useRef<ScrollView>(null);
  // Hook theme — retourne les couleurs selon mode clair/sombre
  const { theme } = useTheme();
  // Hook breakpoint — isTablet est true si l'ecran est >= 768px
  const { isTablet } = useBreakpoint();

  // ETAT — liste des messages du chat avec message de bienvenue initial
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant IA. Je peux vous aider a generer des taches pour ce projet ou repondre a vos questions. Comment puis-je vous aider ?",
      timestamp: new Date(),
    },
  ]);

  // ETAT — texte en cours de saisie
  const [inputText, setInputText] = useState("");
  // ETAT — true quand on attend la reponse de l'IA
  const [isSending, setIsSending] = useState(false);
  // ETAT — true quand on genere des taches
  const [isGenerating, setIsGenerating] = useState(false);

  // Envoie un message a l'assistant IA et ajoute la reponse
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    // Cree le message de l'utilisateur
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Ajoute le message et efface le champ
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsSending(true);

    try {
      // Envoie le message a l'API IA
      const response = await aiApi.chat(inputText.trim(), Number(id));
      // Cree le message de reponse de l'IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Scroll vers le bas pour voir le nouveau message
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
          // Formate la liste des taches generees
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
          Alert.alert("Succes", `${response.tasks.length} tache(s) generee(s) !`);
        } catch (error) {
          Alert.alert("Erreur", "Impossible de generer les taches.");
        } finally {
          setIsGenerating(false);
        }
      },
      "plain-text"
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundTertiary }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* En-tete avec bouton retour et bouton generer */}
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>Assistant IA</Text>
          {/* Bouton pour generer des taches automatiquement */}
          <TouchableOpacity
            onPress={handleGenerateTasks}
            disabled={isGenerating}
            style={[styles.generateButton, { backgroundColor: theme.primary + "15" }]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.generateButtonText, { color: theme.primary }]}>✨ Generer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Zone principale — centree sur tablette avec largeur max */}
        <View style={[styles.mainArea, isTablet && styles.mainAreaTablet]}>
          {/* Liste des messages du chat */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.messagesContent,
              // Plus de padding sur tablette
              isTablet && styles.messagesContentTablet,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  // Bulle plus large sur tablette
                  isTablet && styles.messageBubbleTablet,
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
                {/* Label "🤖 Assistant" uniquement pour les messages de l'IA */}
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
                {/* Heure du message */}
                <Text
                  style={[
                    styles.messageTime,
                    {
                      color: message.role === "user" ? "rgba(255,255,255,0.7)" : theme.textTertiary,
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

            {/* Indicateur de frappe — affiche quand l'IA est en train de repondre */}
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
                <Text style={[styles.roleLabel, { color: theme.textTertiary }]}>🤖 Assistant</Text>
                <ActivityIndicator color={theme.primary} />
              </View>
            )}
          </ScrollView>

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
              placeholder="Posez une question..."
              placeholderTextColor={theme.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
            />
            {/* Bouton envoyer le message */}
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

  // Zone principale — pleine largeur sur mobile
  mainArea: { flex: 1 },
  // Zone principale — centree avec largeur max sur tablette
  mainAreaTablet: { maxWidth: 900, alignSelf: "center", width: "100%" },

  // Messages — padding normal sur mobile
  messagesContent: { padding: 16, gap: 12 },
  // Messages — plus de padding sur tablette
  messagesContentTablet: { padding: 24, gap: 16 },

  // Bulle de message — 80% de largeur sur mobile
  messageBubble: { maxWidth: "80%", padding: 12, borderRadius: 16, gap: 4 },
  // Bulle de message — 60% de largeur sur tablette
  messageBubbleTablet: { maxWidth: "60%" },

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

  // Zone de saisie — padding normal sur mobile
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 0.5,
  },
  // Zone de saisie — plus de padding sur tablette
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
});
