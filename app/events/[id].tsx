// app/events/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { api } from "../../src/api/client";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { colors, radius, spacing, typography } from "../../src/styles/theme";
import type { EventWithDetails } from "../../src/types/api";

import { BottomNav } from "../../src/components/BottomNav";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Number(id);
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadEvent = async () => {
    if (Number.isNaN(eventId)) return;
    try {
      setLoading(true);
      const res = await api.get<EventWithDetails>(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err: any) {
      console.log("Error loading event", err?.response?.data || err?.message);
      Alert.alert("Erreur", "Impossible de charger cet événement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const isParticipant = useMemo(() => {
    if (!user || !event?.participants) return false;
    return event.participants.some((p) => p.userId === user.id);
  }, [user, event]);

  const handleJoin = async () => {
    if (!eventId || Number.isNaN(eventId)) return;
    try {
      setJoining(true);
      await api.post(`/events/${eventId}/join`);
      await loadEvent();
      Alert.alert("Rejoint", "Tu participes maintenant à cet événement !");
    } catch (err: any) {
      console.log("Error joining event", err?.response?.data || err?.message);
      Alert.alert(
        "Erreur",
        err?.response?.data?.message || "Impossible de rejoindre cet événement"
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'événement...</Text>
      </View>
    );
  }

  const dateStr = new Date(event.date).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const participantsCount = event.participants?.length ?? 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {event.title}
            </Text>
          </View>

          <View style={{ width: 32 }} />
        </View>

        {/* Type Pill */}
        <View style={styles.typeContainer}>
          <View style={styles.typePill}>
            <Ionicons
              name="sparkles"
              size={14}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.typeText}>{event.type}</Text>
          </View>
        </View>

        {/* CARD PRINCIPALE */}
        <View style={styles.card}>
          {/* QUAND ? */}
          <View style={styles.infoSection}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Quand ?</Text>
              <Text style={styles.valueText}>{dateStr}</Text>
            </View>
          </View>

          {/* OU ? */}
          {event.address && (
            <View style={[styles.infoSection, { marginTop: spacing.lg }]}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Où ?</Text>
                <Text style={styles.valueText}>{event.address}</Text>
              </View>
            </View>
          )}

          {/* Carte Google */}
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: event.latitude,
                  longitude: event.longitude,
                }}
                title={event.title}
                description={event.address || undefined}
              />
            </MapView>
          </View>

          {/* DESCRIPTION */}
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* CREATOR + PARTICIPANTS */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <View style={styles.metaIconWrapper}>
                <Ionicons
                  name="person-circle"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={styles.metaLabel}>Organisé par</Text>
                <Text style={styles.metaValue}>
                  {event.creator?.username ?? "Inconnu"}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <View style={styles.metaIconWrapper}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.metaLabel}>Participants</Text>
                <Text style={styles.metaValue}>{participantsCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA BUTTONS */}
        <View style={styles.actions}>
          {!isParticipant ? (
            <PrimaryButton
              title={joining ? "Rejoindre..." : "Rejoindre l'événement"}
              onPress={handleJoin}
              loading={joining}
            />
          ) : (
            <>
              <View style={styles.participantBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.participantText}>Tu participes déjà</Text>
              </View>

              <TouchableOpacity
                style={styles.chatButton}
                onPress={() =>
                  router.push({
                    pathname: "/events/[id]/chat",
                    params: { id: String(eventId) },
                  })
                }
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={18}
                  color="#FFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.chatButtonText}>Accéder au chat</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
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
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  typeContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100,
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
  mapWrapper: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    height: 200,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  typeText: {
    ...typography.body,
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  valueText: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
  },
  description: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  metaIconWrapper: {
    marginRight: spacing.sm,
  },
  metaLabel: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  actions: {
    marginTop: spacing.lg,
  },
  participantBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  participantText: {
    ...typography.label,
    color: colors.primary,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  chatButtonText: {
    ...typography.label,
    color: "#FFF",
  },
});