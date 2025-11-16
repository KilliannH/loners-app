// app/events/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../src/api/client";
import { BottomNav } from "../../src/components/BottomNav";
import { useAuth } from "../../src/context/AuthContext";
import { colors, radius, spacing, typography } from "../../src/styles/theme";
import type { Event } from "../../src/types/api";

export default function EventsListScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get<Event[]>("/events");
      setEvents(res.data);
    } catch (err) {
      console.log("Error fetching events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const renderItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/events/[id]",
          params: { id: String(item.id) },
        })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.typePill}>
          <Ionicons
            name="sparkles-outline"
            size={14}
            color={colors.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <Ionicons
          name="time-outline"
          size={16}
          color={colors.textMuted}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.cardMeta}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </View>

      {item.address && (
        <View style={styles.cardRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.cardAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Header custom */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>Loners</Text>
          <Text style={styles.subtitle}>
            Salut {user?.username ?? "toi"} 👋
          </Text>
          <Text style={styles.subtitleMuted}>
            Découvre ce qui se passe autour de toi.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Placeholder pour les filtres
          }}
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchEvents} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="planet-outline"
                size={48}
                color={colors.textMuted}
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyText}>
                Aucun événement pour le moment.
              </Text>
              <Text style={styles.emptySubText}>
                Crée-en un ou reviens un peu plus tard ✨
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl * 3,
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.label,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  typeText: {
    ...typography.body,
    fontSize: 12,
    color: colors.primary,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  cardMeta: {
    ...typography.body,
    color: colors.textMuted,
  },
  cardAddress: {
    ...typography.body,
    color: colors.text,
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