export const API_BASE_URL = "https://api.costincianu.fr";

export const MERCURE_URL = "https://mercure.costincianu.fr/.well-known/mercure";

export const API_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REFRESH: "/api/token/refresh",
  REGISTER: "/api/auth/register",
  FORGOT_PASSWORD: "/api/auth/forgot-password",
  RESET_PASSWORD: "/api/auth/reset-password",
  VERIFY_2FA: "/api/auth/2fa/verify",
  PROFILE: "/api/auth/me",
  AVATAR: "/api/auth/avatar",
  PROJECTS: "/api/projects",
  PROJECT: (id: number) => `/api/projects/${id}`,
  TASKS: "/api/tasks",
  TASK: (id: number) => `/api/tasks/${id}`,
  NOTIFICATIONS: "/api/notifications",
  PUSH_TOKEN: "/api/push-tokens",
} as const;
