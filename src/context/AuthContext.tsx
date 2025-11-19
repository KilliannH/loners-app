// src/context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, clearTokens, loadTokens, saveTokens } from "../api/client";
import { useNotifications } from "../hooks/useNotifications";
import type { AuthResponse, User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  socket: Socket | null;
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
  const [socket, setSocket] = useState<Socket | null>(null);

  // Setup des notifications push
  useNotifications(!!user);

  // Setup du socket global
  useEffect(() => {
    if (!user) {
      // Déconnecter le socket si pas d'utilisateur
      if (socket) {
        console.log("🔌 Disconnecting global socket");
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Ne pas recréer si le socket existe déjà
    if (socket) {
      console.log("🔌 Socket already exists, skipping setup");
      return;
    }

    // Créer une connexion socket globale
    const setupGlobalSocket = async () => {
      try {
        const baseURL = api.defaults.baseURL;
        const token = await AsyncStorage.getItem("accessToken");

        console.log("🔌 Setting up global socket...");
        console.log("🔌 BaseURL:", baseURL);
        console.log("🔌 Token exists:", !!token);

        const newSocket = io(baseURL, {
          auth: { token },
        });

        newSocket.on("connect", () => {
          console.log("✅ Global socket CONNECTED - ID:", newSocket.id);
          // Mettre à jour le state APRÈS la connexion
          setSocket(newSocket);
        });

        newSocket.on("disconnect", () => {
          console.log("❌ Global socket DISCONNECTED");
          setSocket(null);
        });

        newSocket.on("error", (error) => {
          console.log("❌ Global socket ERROR:", error);
        });

        console.log("🔌 Global socket instance created (waiting for connection...)");
      } catch (err) {
        console.log("❌ Error setting up global socket:", err);
      }
    };

    setupGlobalSocket();

    return () => {
      console.log("🔌 Cleanup function called");
    };
  }, [user]); // Retirer 'socket' des dépendances

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
      // Supprimer le push token du backend
      await api.delete("/push-token").catch(() => {});
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
        socket,
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