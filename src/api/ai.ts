// =====================================================
// ai.ts — API pour les fonctionnalites IA
// Utilise le backend Symfony qui appelle l'IA
// pour generer des taches et repondre au chat
// =====================================================

import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/constants/api";

// Type pour une tache generee par l'IA
interface GeneratedTask {
  title: string;
  description: string;
  priority: string;
  estimatedTime: number | null;
}

// Type pour la reponse de generation de taches
interface GenerateTasksResponse {
  tasks: GeneratedTask[];
}

// Type pour la reponse du chat IA
interface AIChatResponse {
  content: string; // l'API retourne 'content' pas 'message'
  simulated: boolean;
}
export const aiApi = {
  /**
   * Genere des taches automatiquement pour un projet.
   * Envoie une description du projet a l'IA qui retourne
   * une liste de taches suggereees.
   */
  async generateTasks(
    projectId: number,
    description: string,
  ): Promise<GenerateTasksResponse> {
    const { data } = await apiClient.post(API_ENDPOINTS.AI_GENERATE_TASKS, {
      projectId,
      description,
    });
    return data;
  },

  /**
   * Envoie un message a l'assistant IA.
   * Retourne une reponse contextuelle sur le projet.
   */
  async chat(message: string, projectId?: number): Promise<AIChatResponse> {
    const { data } = await apiClient.post(API_ENDPOINTS.AI_CHAT, {
      messages: [{ role: "user", content: message }],
      projectId,
    });
    console.log("Reponse IA:", JSON.stringify(data));
    return data;
  },
};
