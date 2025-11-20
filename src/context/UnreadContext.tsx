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
  const [myEventIds, setMyEventIds] = useState<number[]>([]);
  const { socket, user } = useAuth();

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get<UnreadCount>("/messages/unread-counts");
      setUnreadCounts(res.data);
      
      // Récupérer aussi la liste des événements où je participe
      const eventIds = Object.keys(res.data).map(id => parseInt(id, 10));
      setMyEventIds(eventIds);
    } catch (err) {
      console.log("Error fetching unread counts:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
    }
  }, [user]);

  // Rejoindre toutes les rooms des événements où je participe
  useEffect(() => {
    if (!socket || myEventIds.length === 0) {
      return;
    }
    
    // Rejoindre chaque room
    myEventIds.forEach(eventId => {
      socket.emit("join_event", eventId);
    });

    // Écouter les confirmations
    socket.on("joined_event", ({ eventId }) => {
      console.log(`✅ Joined room for event ${eventId}`);
    });

    socket.on("join_denied", ({ eventId, reason }) => {
      console.log(`❌ Join denied for event ${eventId}:`, reason);
    });

    return () => {
      socket.off("joined_event");
      socket.off("join_denied");
    };
  }, [socket, myEventIds]);

  // Écouter les nouveaux messages via le socket global
  useEffect(() => {
    
    if (!socket) {
      return;
    }

    const handleNewMessage = (message: ChatMessage) => {
      
      // Incrémenter le compteur pour cet événement
      setUnreadCounts((prev) => {
        const newCount = (prev[message.eventId] || 0) + 1;
        return {
          ...prev,
          [message.eventId]: newCount,
        };
      });
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