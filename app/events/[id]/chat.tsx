// app/events/[id]/chat.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { io, Socket } from "socket.io-client";

import { api } from "../../../src/api/client";
import { useAuth } from "../../../src/context/AuthContext";
import { useUnread } from "../../../src/context/UnreadContext";
import { colors, radius, spacing, typography } from "../../../src/styles/theme";
import type { ChatMessage } from "../../../src/types/api";

const getInitials = (username: string) => {
  if (!username) return "?";
  const parts = username.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

type Params = {
  id: string;
  title?: string;
};

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const initials = getInitials(message.sender.username);

  return (
    <View
      style={[
        styles.bubbleRow,
        isOwn ? styles.bubbleRowRight : styles.bubbleRowLeft,
      ]}
    >
      {!isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View
        style={[
          styles.bubbleContainer,
          isOwn ? styles.bubbleRight : styles.bubbleLeft,
        ]}
      >
        {!isOwn && (
          <Text style={styles.bubbleUsername}>{message.sender.username}</Text>
        )}
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther,
            ]}
          >
            {message.text}
          </Text>
        </View>
        <Text style={styles.bubbleTime}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {isOwn && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
    </View>
  );
};

export default function EventChatScreen() {
  const { id, title } = useLocalSearchParams<Params>();
  const eventId = Number(id);
  const router = useRouter();
  const { user } = useAuth();
  const { markAsRead, incrementUnread } = useUnread();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Marquer comme lu quand on entre dans le chat
  useEffect(() => {
    if (!Number.isNaN(eventId)) {
      markAsRead(eventId);
    }
  }, [eventId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const loadHistory = async () => {
    try {
      const res = await api.get<ChatMessage[]>(`/messages/event/${eventId}`);
      setMessages(res.data);
    } catch (err: any) {
      console.log("Error loading messages", err?.response?.data || err?.message);
    }
  };

  const setupSocket = async () => {
    try {
      const baseURL = api.defaults.baseURL;
      const token = await AsyncStorage.getItem("accessToken");

      const socket = io(baseURL, {
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setSocketConnected(true);
        socket.emit("join_event", eventId);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
      });

      socket.on("new_message", (message: ChatMessage) => {
        if (message.eventId === eventId) {
          setMessages((prev) => [...prev, message]);
          // Marquer comme lu immédiatement puisqu'on est dans le chat
          markAsRead(eventId);
        }
        // Plus besoin d'incrémenter ici, c'est géré globalement dans UnreadContext
      });

      socket.on("join_denied", (payload) => {
        console.log("join_denied", payload);
      });

      socket.on("message_denied", (payload) => {
        console.log("message_denied", payload);
      });
    } catch (err) {
      console.log("❌ Chat: Error setting up socket", err);
    }
  };

  useEffect(() => {
    if (Number.isNaN(eventId)) return;

    const init = async () => {
      setLoading(true);
      await loadHistory();
      await setupSocket();
      setLoading(false);
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages.length]);

  const handleSend = () => {
    if (!input.trim() || !socketRef.current || !socketConnected) return;

    const text = input.trim();
    socketRef.current.emit("send_message", { eventId, text });
    setInput("");
    scrollToBottom();
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du chat...</Text>
      </View>
    );
  }

  const headerTitle = title || "Chat de l'événement";

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {headerTitle}
          </Text>
          <View style={styles.headerStatusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: socketConnected
                    ? colors.primary
                    : colors.textMuted,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {socketConnected ? "Connecté" : "Hors ligne"}
            </Text>
          </View>
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* LISTE DES MESSAGES */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.sender.id === user?.id} />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
            <Text style={styles.emptySubText}>
              Soit le premier à briser la glace ! 👋
            </Text>
          </View>
        }
      />

      {/* BARRE D'INPUT */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[
            styles.sendButton,
            (!input.trim() || !socketConnected) && styles.sendButtonDisabled,
          ]}
          disabled={!input.trim() || !socketConnected || sending}
        >
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.text,
  },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  statusText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl * 3,
  },
  emptyText: {
    ...typography.title,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  bubbleContainer: {
    maxWidth: "75%",
  },
  bubbleLeft: {
    alignSelf: "flex-start",
  },
  bubbleRight: {
    alignSelf: "flex-end",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: spacing.xs,
  },
  avatarText: {
    ...typography.body,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: "#FFFFFF",
  },
  bubbleTextOther: {
    color: colors.text,
  },
  bubbleUsername: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: "600",
  },
  bubbleTime: {
    ...typography.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingTop: spacing.sm + 4,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
});