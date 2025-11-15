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
                <ActivityIndicator />
                <Text style={styles.loadingText}>Chargement de l’événement...</Text>
            </View>
        );
    }

    const dateStr = new Date(event.date).toLocaleString();
    const participantsCount = event.participants?.length ?? 0;

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* HEADER : Back + Title (centré) */}
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={26}
                            color={colors.text}
                        />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text numberOfLines={1} style={styles.headerTitle}>
                            {event.title}
                        </Text>
                    </View>

                    {/* Espace vide pour équilibrer la flèche */}
                    <View style={{ width: 32 }} />
                </View>

                {/* Type Pill */}
                <View style={styles.typeContainer}>
                    <View style={styles.typePill}>
                        <Ionicons
                            name="sparkles-outline"
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
                    <View style={styles.infoRow}>
                        <Ionicons
                            name="time-outline"
                            size={18}
                            color={colors.textMuted}
                            style={{ marginRight: 8 }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionLabel}>Quand ?</Text>
                            <Text style={styles.valueText}>{dateStr}</Text>
                        </View>
                    </View>

                    {/* OU ? */}
                    {event.address && (
                        <View style={[styles.infoRow, { marginTop: spacing.md }]}>
                            <Ionicons
                                name="location-outline"
                                size={18}
                                color={colors.textMuted}
                                style={{ marginRight: 8 }}
                            />
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
                            pointerEvents="none" // juste affichage (tu peux enlever pour rendre la map interactive)
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
                            <Ionicons
                                name="person-circle-outline"
                                size={20}
                                color={colors.textMuted}
                                style={{ marginRight: 6 }}
                            />
                            <View>
                                <Text style={styles.metaLabel}>Organisé par</Text>
                                <Text style={styles.metaValue}>
                                    {event.creator?.username ?? "Inconnu"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaItem}>
                            <Ionicons
                                name="people-outline"
                                size={20}
                                color={colors.textMuted}
                                style={{ marginRight: 6 }}
                            />
                            <View>
                                <Text style={styles.metaLabel}>Participants</Text>
                                <Text style={styles.metaValue}>{participantsCount}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CTA BUTTONS */}
                <View style={styles.actions}>
                    <PrimaryButton
                        title={
                            isParticipant
                                ? "Tu participes déjà"
                                : joining
                                    ? "Rejoindre..."
                                    : "Rejoindre l’événement"
                        }
                        onPress={handleJoin}
                        loading={joining}
                    />

                    {isParticipant && (
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
                                name="chatbubble-ellipses-outline"
                                size={18}
                                color={colors.primary}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={styles.chatButtonText}>Accéder au chat</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
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
        padding: spacing.sm,
        borderRadius: radius.md,
    },

    headerCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: spacing.sm,
        marginRight: spacing.sm,
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
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl * 2,
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
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    mapWrapper: {
        marginTop: spacing.md,
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    title: {
        ...typography.title,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm,
    },
    typePill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.surfaceAlt,
    },
    typeText: {
        ...typography.body,
        fontSize: 12,
        color: colors.primary,
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
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    sectionLabel: {
        ...typography.label,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    valueText: {
        ...typography.body,
        color: colors.text,
    },
    description: {
        ...typography.body,
        color: colors.text,
        marginTop: spacing.xs,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing.lg,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
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
    },
    actions: {
        marginTop: spacing.lg,
    },
    chatButton: {
        marginTop: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.sm,
    },
    chatButtonText: {
        ...typography.label,
        color: colors.primary,
    },
});
