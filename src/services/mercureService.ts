// =====================================================
// mercureService — Connexion temps réel via Mercure SSE
// Écoute les événements du serveur (chat, activité,
// notifications) en temps réel via Server-Sent Events
// =====================================================

import EventSource from "react-native-sse";
import { MERCURE_URL } from "@/constants/api";
import { tokenService } from "./tokenService";

// Type pour les handlers d'événements
type MercureHandler = (data: unknown) => void;

class MercureService {
  // Connexion SSE active
  private eventSource: EventSource | null = null;
  // Map des handlers par type d'événement
  private handlers: Map<string, MercureHandler[]> = new Map();
  // État de la connexion
  private isConnected = false;
  // ID utilisateur connecté (pour les topics)
  private userId: number | null = null;

  /**
   * Ouvre la connexion SSE Mercure.
   * S'abonne aux topics de l'utilisateur connecté.
   */
  // async connect(userId: number): Promise<void> {
  //   // Évite les connexions multiples
  //   if (this.isConnected && this.userId === userId) return;

  //   this.userId = userId;
  //   const token = await tokenService.getAccessToken();
  //   if (!token) return;

  //   // Topics auxquels on s'abonne
  //   const topics = [
  //     `/users/${userId}`, // Notifications personnelles
  //     `/projects/user/${userId}`, // Activité des projets
  //     `/chat/user/${userId}`, // Messages de chat
  //   ];

  //   // Construction de l'URL Mercure avec les topics
  //   const url = new URL(MERCURE_URL);
  //   topics.forEach((topic) => url.searchParams.append("topic", topic));
  //   url.searchParams.set("authorization", token);

  //   // Ouverture de la connexion SSE
  //   this.eventSource = new EventSource(url.toString());

  //   // Réception d'un message
  //   this.eventSource.onmessage = (event: MessageEvent) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       const type: string = data.type ?? "unknown";
  //       // Déclenche les handlers enregistrés pour ce type
  //       this.emit(type, data);
  //     } catch {
  //       // Message non-JSON ignoré
  //     }
  //   };

  //   // Erreur de connexion — reconnexion automatique
  //   this.eventSource.onerror = () => {
  //     this.isConnected = false;
  //     console.log("Mercure déconnecté — reconnexion dans 5s");
  //     setTimeout(() => {
  //       if (this.userId) this.connect(this.userId);
  //     }, 5000);
  //   };

  //   // Connexion établie
  //   this.eventSource.onopen = () => {
  //     this.isConnected = true;
  //     console.log("Mercure connecté");
  //   };
  // }

  async connect(userId: number): Promise<void> {
    // Mercure SSE necessite un development build
    // Sera active en Phase 6 avec EAS Build
    console.log("Mercure : sera active en development build");
    return;
  }

  /**
   * Ferme la connexion SSE.
   * À appeler lors de la déconnexion de l'utilisateur.
   */
  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.isConnected = false;
    this.userId = null;
    this.handlers.clear();
    console.log("Mercure déconnecté");
  }

  /**
   * Enregistre un handler pour un type d'événement.
   * Exemple : mercureService.on('chat_message', handler)
   */
  on(eventType: string, handler: MercureHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Retire un handler pour un type d'événement.
   */
  off(eventType: string, handler: MercureHandler): void {
    const handlers = this.handlers.get(eventType) ?? [];
    this.handlers.set(
      eventType,
      handlers.filter((h) => h !== handler)
    );
  }

  /**
   * Déclenche tous les handlers d'un type d'événement.
   */
  private emit(eventType: string, data: unknown): void {
    const handlers = this.handlers.get(eventType) ?? [];
    handlers.forEach((h) => h(data));
  }

  /**
   * Retourne l'état de la connexion.
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton — une seule instance partagée dans toute l'app
export const mercureService = new MercureService();
