// src/context/UnreadContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import type { ChatMessage } from "../types/api";
import { useAuth } from "./AuthContext";

type UnreadCount = {
  [eventId: number]: number;
};

type UnreadContextValue = {
  unreadCounts: UnreadCount;
  totalUnread: number;
  markAsRead: (eventId: number) => void;
  incrementUnread: (eventId: number) => void;
  fetchUnreadCounts: () => Promise<void>;
};

const UnreadContext = createContext<UnreadContextValue | undefined>(undefined);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount>({});
  const { socket, user } = useAuth();

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get<UnreadCount>("/messages/unread-counts");
      setUnreadCounts(res.data);
    } catch (err) {
      console.log("Error fetching unread counts:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
    }
  }, [user]);

  // Écouter les nouveaux messages via le socket global
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: ChatMessage) => {
      console.log("New message received globally:", message.eventId);
      // Incrémenter le compteur pour cet événement
      setUnreadCounts((prev) => ({
        ...prev,
        [message.eventId]: (prev[message.eventId] || 0) + 1,
      }));
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);

  const markAsRead = (eventId: number) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [eventId]: 0,
    }));

    // Informer le backend
    api.post(`/messages/event/${eventId}/mark-read`).catch((err) => {
      console.log("Error marking as read:", err);
    });
  };

  const incrementUnread = (eventId: number) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] || 0) + 1,
    }));
  };

  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <UnreadContext.Provider
      value={{
        unreadCounts,
        totalUnread,
        markAsRead,
        incrementUnread,
        fetchUnreadCounts,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => {
  const ctx = useContext(UnreadContext);
  if (!ctx) {
    throw new Error("useUnread must be used within an UnreadProvider");
  }
  return ctx;
};