// src/context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api, clearTokens, loadTokens, saveTokens } from "../api/client";
import type { AuthResponse, User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // au démarrage : on tente de charger l'user
  useEffect(() => {
    const init = async () => {
      try {
        const { accessToken } = await loadTokens();
        if (!accessToken) {
          setLoading(false);
          return;
        }
        const res = await api.get<User>("/auth/me");
        setUser(res.data);
      } catch (err) {
        await clearTokens();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAuthSuccess = async (data: AuthResponse) => {
    await saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    await handleAuthSuccess(res.data);
  };

  const signUp = async (email: string, username: string, password: string) => {
    const res = await api.post<AuthResponse>("/auth/register", {
      email,
      username,
      password,
    });
    await handleAuthSuccess(res.data);
  };

  const signOut = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // pas grave
    }
    await clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
