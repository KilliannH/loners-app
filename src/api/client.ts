// src/api/client.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { AuthResponse } from "../types/api";

const BACKEND_URL = "http://192.168.1.5:4000"; // à adapter si besoin

export const api = axios.create({
  baseURL: BACKEND_URL,
});

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const setAuthHeader = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.setItem("accessToken", accessToken);
  await AsyncStorage.setItem("refreshToken", refreshToken);
  setAuthHeader(accessToken);
};

export const clearTokens = async () => {
  await AsyncStorage.removeItem("accessToken");
  await AsyncStorage.removeItem("refreshToken");
  setAuthHeader(null);
};

export const loadTokens = async () => {
  const accessToken = await AsyncStorage.getItem("accessToken");
  const refreshToken = await AsyncStorage.getItem("refreshToken");
  if (accessToken) setAuthHeader(accessToken);
  return { accessToken, refreshToken };
};

// Intercepteur pour refresh token auto
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // pas de 401 -> on laisse passer
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // on évite les boucles infinies
    originalRequest._retry = true;

    if (isRefreshing) {
      // on met la requête en attente le temps que le refresh se termine
      return new Promise((resolve, reject) => {
        pendingRequests.push((newToken) => {
          if (newToken) {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          }
          api(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) {
        await clearTokens();
        return Promise.reject(error);
      }

      const res = await api.post<AuthResponse>("/auth/refresh", {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = res.data;
      await saveTokens(accessToken, newRefreshToken);

      // on rejoue les requêtes en attente
      pendingRequests.forEach((cb) => cb(accessToken));
      pendingRequests = [];
      isRefreshing = false;

      originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (e) {
      pendingRequests.forEach((cb) => cb(null));
      pendingRequests = [];
      isRefreshing = false;
      await clearTokens();
      return Promise.reject(e);
    }
  }
);
