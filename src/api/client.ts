import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { tokenService } from "@/services/tokenService";
import { DeviceEventEmitter } from "react-native";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // =====================
    // Gestion du rate limiting (429)
    // Emet un événement global pour afficher un toast d'alerte
    // =====================
    if (error.response?.status === 429) {
      const data = error.response.data as { error?: string; retryAfter?: number };
      DeviceEventEmitter.emit("rate-limit-error", {
        message: data?.error || "Trop de requêtes — veuillez patienter quelques instants.",
        retryAfter: data?.retryAfter,
      });
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenService.getRefreshToken();
        if (!refreshToken) throw new Error("Pas de refresh token");

        const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.REFRESH}`, {
          refreshToken: refreshToken,
        });

        await tokenService.saveTokens(data.token, data.refreshToken);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenService.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
