// =====================================================
// offlineService — Gestion du mode hors ligne
// Stocke les donnees en local avec AsyncStorage
// Detecte la connectivite reseau
// Synchronise les donnees quand la connexion revient
// =====================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";

// Cles de stockage local
const KEYS = {
  PROJECTS: "offline_projects",
  TASKS: "offline_tasks",
  PENDING_ACTIONS: "offline_pending_actions",
};

// Type pour une action en attente de synchronisation
interface PendingAction {
  id: string;
  type: "CREATE_TASK" | "UPDATE_TASK" | "ADD_COMMENT";
  payload: unknown;
  createdAt: string;
}

export const offlineService = {
  /**
   * Verifie si l'appareil est connecte a internet.
   */
  async isOnline(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected ?? false;
  },

  /**
   * Sauvegarde les projets en local pour le mode offline.
   * Appele apres chaque chargement reussi depuis l'API.
   */
  async saveProjects(projects: unknown[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.log("Erreur sauvegarde projets offline:", error);
    }
  },

  /**
   * Recupere les projets depuis le stockage local.
   * Utilise quand l'appareil est hors ligne.
   */
  async getProjects(): Promise<unknown[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Sauvegarde les taches en local pour le mode offline.
   */
  async saveTasks(tasks: unknown[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.log("Erreur sauvegarde taches offline:", error);
    }
  },

  /**
   * Recupere les taches depuis le stockage local.
   */
  async getTasks(): Promise<unknown[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Ajoute une action en attente de synchronisation.
   * Par exemple : creer une tache sans connexion internet.
   */
  async addPendingAction(
    action: Omit<PendingAction, "id" | "createdAt">,
  ): Promise<void> {
    try {
      const existing = await this.getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        KEYS.PENDING_ACTIONS,
        JSON.stringify([...existing, newAction]),
      );
    } catch (error) {
      console.log("Erreur ajout action pending:", error);
    }
  },

  /**
   * Recupere toutes les actions en attente.
   */
  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_ACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Supprime toutes les actions en attente apres synchronisation.
   */
  async clearPendingActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.PENDING_ACTIONS);
    } catch (error) {
      console.log("Erreur suppression actions pending:", error);
    }
  },

  /**
   * Efface toutes les donnees offline.
   * A appeler lors de la deconnexion.
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.log("Erreur suppression donnees offline:", error);
    }
  },
};
