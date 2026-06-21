export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  // refresh_token: string;
  refreshToken: string; // ✅ camelCase comme l'API Symfony
}

export interface TwoFactorPayload {
  code: string;
  tempToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}
