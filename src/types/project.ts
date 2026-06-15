// =====================================================
// project.ts — Types TypeScript pour les projets
// Definit la structure des donnees utilisees dans
// toute l'application pour les projets et leurs membres
// =====================================================

import { User } from "./user";

// =====================
// TYPES DE BASE
// Ces types limitent les valeurs possibles pour
// certains champs — evite les erreurs de saisie
// =====================

// Statut possible d'un projet
export type ProjectStatus = "active" | "archived" | "completed";

// Niveau de priorite d'un projet
export type ProjectPriority = "low" | "medium" | "high" | "critical";

// Role d'un membre dans une equipe
export type TeamRole = "admin" | "manager" | "dev" | "client";

// =====================
// INTERFACE PROJET
// Represente un projet tel que retourne par l'API Symfony
// Chaque propriete correspond a un champ en base de donnees
// =====================
export interface Project {
  id: number; // Identifiant unique du projet
  name: string; // Nom du projet
  description: string | null; // Description (peut etre vide)
  status: ProjectStatus; // Statut : actif, archive ou termine
  priority: ProjectPriority; // Priorite : low, medium, high, critical
  color: string | null; // Couleur d'affichage (code hex ex: #6366F1)
  startDate: string | null; // Date de debut (format YYYY-MM-DD)
  endDate: string | null; // Date de fin (format YYYY-MM-DD)
  progress: number; // Pourcentage d'avancement (0 a 100)
  members: ProjectMember[]; // Liste des membres de l'equipe
  tasksCount: number; // Nombre total de taches
  completedTasksCount: number; // Nombre de taches terminees
  createdAt: string; // Date de creation
  updatedAt: string; // Date de derniere modification
}

// =====================
// INTERFACE MEMBRE D'EQUIPE
// Represente un utilisateur membre d'un projet
// avec son role specifique dans ce projet
// =====================
export interface ProjectMember {
  id: number; // Identifiant de la relation membre-projet
  user: User; // Informations de l'utilisateur
  role: TeamRole; // Role dans ce projet specifique
  joinedAt: string; // Date d'ajout au projet
}

// =====================
// PAYLOAD CREATION PROJET
// Donnees envoyees a l'API pour creer un nouveau projet
// Les champs optionnels (?) ne sont pas obligatoires
// =====================
export interface CreateProjectPayload {
  name: string; // Nom du projet — obligatoire
  description?: string; // Description — optionnel
  priority?: ProjectPriority; // Priorite — optionnel
  color?: string; // Couleur hex — optionnel
  status?: string; // Statut initial — optionnel
  progress?: number; // Progression initiale — optionnel
  startDate?: string; // Date de debut — optionnel
  endDate?: string; // Date de fin — optionnel
}

// =====================
// PAYLOAD MODIFICATION PROJET
// Donnees envoyees a l'API pour modifier un projet existant
// Tous les champs sont optionnels — on envoie seulement
// ce qu'on veut modifier
// =====================
export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: string; // Nouveau statut
  color?: string; // Nouvelle couleur
}
