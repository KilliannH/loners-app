// app/chats/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { api } from "../../src/api/client";
import { BottomNav } from "../../src/components/BottomNav";
import { useAuth } from "../../src/context/AuthContext";
import { colors, radius, spacing, typography } from "../../src/styles/theme";
import type { EventWithDetails } from "../../src/types/api";

export default function ChatsListScreen() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      // Route backend qui retourne les événements où l'utilisateur participe
      const res = await api.get<EventWithDetails[]>("/events/my-participations");
      setEvents(res.data);
    } catch (err) {
      console.log("Error fetching my events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const getInitials = (username: string) => {
    if (!username) return "?";
    const parts = username.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const renderItem = ({ item }: { item: EventWithDetails }) => {
    const participantsCount = item.participants?.length ?? 0;
    const dateStr = new Date(item.date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() =>
          router.push({
            pathname: "/events/[id]/chat",
            params: { id: String(item.id), title: item.title },
          })
        }
      >
        <View style={styles.chatAvatar}>
          <Ionicons name="people" size={24} color={colors.primary} />
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.chatDate}>{dateStr}</Text>
          </View>

          <View style={styles.chatMeta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
            <View style={styles.participantsBadge}>
              <Ionicons
                name="people-outline"
                size={14}
                color={colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.participantsText}>
                {participantsCount} {participantsCount > 1 ? "participants" : "participant"}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>Loners</Text>
          <Text style={styles.subtitle}>Mes conversations</Text>
          <Text style={styles.subtitleMuted}>
            {events.length} {events.length > 1 ? "événements" : "événement"} en cours
          </Text>
        </View>
      </View>

      {/* LISTE DES CHATS */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMyEvents} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyText}>
                Aucune conversation pour le moment
              </Text>
              <Text style={styles.emptySubText}>
                Rejoins un événement pour commencer à chatter ! 💬
              </Text>
            </View>
          ) : null
        }
      />

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    ...typography.title,
    color: colors.text,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  subtitleMuted: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 120,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  chatTitle: {
    ...typography.label,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatDate: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  typeText: {
    ...typography.body,
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  participantsBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantsText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyContainer: {
    marginTop: spacing.xl * 2,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
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
});