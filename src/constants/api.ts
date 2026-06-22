// =====================================================
// api.ts — URLs et endpoints de l'API Symfony
// Base URL : https://api.costincianu.fr
// =====================================================

export const API_BASE_URL = "https://api.costincianu.fr";

export const MERCURE_URL = "https://mercure.costincianu.fr/.well-known/mercure";

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  FORGOT_PASSWORD: "/api/auth/forgot-password",
  RESET_PASSWORD: "/api/auth/reset-password",
  PROFILE: "/api/auth/me",
  UPDATE_PROFILE: "/api/auth/profile",
  AVATAR: "/api/auth/avatar",
  // REFRESH: "/api/token/refresh",
  REFRESH: "/api/auth/refresh", // ✅

  // 2FA
  VERIFY_2FA: "/api/auth/2fa/verify",
  SEND_2FA: "/api/auth/2fa/send",
  TOGGLE_2FA: "/api/auth/2fa/toggle",

  // OAuth
  OAUTH_GOOGLE: "/api/auth/google",
  OAUTH_GITHUB: "/api/auth/github",

  // Projets
  PROJECTS: "/api/projects",
  PROJECT: (id: number) => `/api/projects/${id}`,

  // Taches
  TASKS: "/api/tasks",
  TASK: (id: number) => `/api/tasks/${id}`,

  // Sous-taches
  SUBTASKS: (taskId: number) => `/api/tasks/${taskId}/subtasks`,
  SUBTASK: (id: number) => `/api/tasks/subtasks/${id}`,

  // Commentaires
  COMMENTS: (taskId: number) => `/api/tasks/${taskId}/comments`,
  COMMENT: (id: number) => `/api/tasks/comments/${id}`,

  // Fichiers attaches aux taches
  ATTACHMENTS: (taskId: number) => `/api/tasks/${taskId}/attachments`,
  ATTACHMENT: (id: number) => `/api/tasks/attachments/${id}`,

  // Notifications
  NOTIFICATIONS: "/api/mentions",
  NOTIFICATION_READ: (id: number) => `/api/mentions/${id}/read`,
  NOTIFICATION_READ_ALL: "/api/mentions/read-all",

  // Chat
  CHAT: "/api/chat",
  CHAT_DELETE: (id: number) => `/api/chat/${id}`,

  // Push notifications
  PUSH_TOKEN: "/api/push/subscribe",
  PUSH_VAPID_KEY: "/api/push/vapid-key",

  // IA
  AI_CHAT: "/api/ai/chat",
  AI_GENERATE_TASKS: "/api/ai/generate-tasks",

  // Wiki
  WIKI: (projectId: number) => `/api/wiki/project/${projectId}`,
  WIKI_ITEM: (id: number) => `/api/wiki/${id}`,
  WIKI_CREATE: "/api/wiki",
  WIKI_UPDATE: (id: number) => `/api/wiki/${id}`,
  WIKI_DELETE: (id: number) => `/api/wiki/${id}`,

  // Equipe
  USERS: "/api/users",
  INVITE: "/api/invitations",
  INVITATIONS: (projectId: number) => `/api/invitations/project/${projectId}`,

  // Logs
  LOGS: "/api/logs",

  // Admin
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_USERS: "/api/admin/users",

  // Templates
  TEMPLATES: "/api/templates",
  TEMPLATE: (id: number) => `/api/templates/${id}`,
  TEMPLATE_CREATE_PROJECT: (id: number) =>
    `/api/templates/${id}/create-project`,

  // Champs personnalisés
  CUSTOM_FIELDS_BY_PROJECT: (projectId: number) =>
    `/api/custom-fields/project/${projectId}`,
  CUSTOM_FIELDS_BY_TASK: (taskId: number) =>
    `/api/custom-fields/task/${taskId}`,
  CUSTOM_FIELD_CREATE: "/api/custom-fields",
  CUSTOM_FIELD_UPDATE: (id: number) => `/api/custom-fields/${id}`,
  CUSTOM_FIELD_DELETE: (id: number) => `/api/custom-fields/${id}`,

  // Sprints et Backlog
  SPRINTS_BY_PROJECT: (projectId: number) =>
    `/api/sprints/project/${projectId}`,
  SPRINT_BACKLOG: (projectId: number) =>
    `/api/sprints/project/${projectId}/backlog`,
  SPRINT_CREATE: "/api/sprints",
  SPRINT_UPDATE: (id: number) => `/api/sprints/${id}`,
  SPRINT_DELETE: (id: number) => `/api/sprints/${id}`,
  SPRINT_ASSIGN_TASK: (id: number) => `/api/sprints/${id}/assign-task`,
  SPRINT_REMOVE_TASK: (id: number) => `/api/sprints/${id}/remove-task`,

  // Recherche globale
  SEARCH: "/api/search",

  // Rapports
  REPORT_BURNDOWN: (sprintId: number) =>
    `/api/reports/sprint/${sprintId}/burndown`,
  REPORT_PROJECT_STATS: (projectId: number) =>
    `/api/reports/project/${projectId}/stats`,

  // Stripe
  STRIPE_CHECKOUT: "/api/stripe/checkout",
  STRIPE_PORTAL: "/api/stripe/portal",
  STRIPE_PLAN: "/api/stripe/plan",
  STRIPE_PUBLIC_KEY: "/api/stripe/public-key",
} as const;
