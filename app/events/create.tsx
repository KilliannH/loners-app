// app/events/create.tsx
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { useToast } from "@/src/context/ToastContext";
import { api } from "../../src/api/client";
import { BottomNav } from "../../src/components/BottomNav";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { colors, radius, spacing, typography } from "../../src/styles/theme";

const GOOGLE_MAPS_API_KEY =
  (Constants.expoConfig?.extra as any)?.placesApiKey;

type PlacePrediction = {
  place_id: string;
  description: string;
};

export default function CreateEventScreen() {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("soirée");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState<Date | null>(null);
  const [isDateModalVisible, setDateModalVisible] = useState(false);

  const [addressQuery, setAddressQuery] = useState("");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const showDatePickerModal = () => setDateModalVisible(true);
  const hideDatePickerModal = () => setDateModalVisible(false);

  const handleConfirmDate = (selectedDate: Date) => {
    setDate(selectedDate);
    hideDatePickerModal();
  };

  const fetchSuggestions = async (query: string) => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith("TA_CLE_")) {
      console.warn("Google Maps API key missing or placeholder");
      return;
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const encoded = encodeURIComponent(query.trim());
      
      // Utilisation de Geocoding API au lieu de Places Autocomplete
      // Plus simple et trouve plus d'adresses
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&language=fr&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.log("Geocoding error:", data);
        setSuggestions([]);
        return;
      }

      // Transformer les résultats au bon format
      const predictions = data.results?.map((result: any) => ({
        place_id: result.place_id,
        description: result.formatted_address,
      })) || [];

      setSuggestions(predictions);
    } catch (err: any) {
      console.log("Geocoding fetch error:", err?.message || err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (prediction: PlacePrediction) => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith("TA_CLE_")) {
      toast.error("La clé Google Maps n'est pas configurée dans extra.googleMapsApiKey.");
      return;
    }

    try {
      setAddressQuery(prediction.description);
      setAddress(prediction.description);
      setSuggestions([]);

      // Utiliser Geocoding API pour récupérer les coordonnées
      const encoded = encodeURIComponent(prediction.description);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "OK" || !data.results || data.results.length === 0) {
        console.log("Geocoding error:", data);
        toast.error("Impossible de récupérer les coordonnées de ce lieu.");
        return;
      }

      const result = data.results[0];
      const loc = result.geometry.location;
      
      setLatitude(loc.lat);
      setLongitude(loc.lng);
      setAddress(result.formatted_address);
      setAddressQuery(result.formatted_address);
    } catch (err: any) {
      console.log("Geocoding fetch error:", err?.message || err);
      toast.error("Impossible de récupérer les coordonnées de ce lieu.");
    }
  };

  const handleCreate = async () => {
    if (!title || !type || !description || !date) {
      toast.warning("Merci de remplir le titre, le type, la description et la date.");
      return;
    }

    if (!address || latitude == null || longitude == null) {
      toast.warning("Choisis une adresse dans les suggestions pour localiser l'événement.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/events", {
        title,
        description,
        type,
        date: date.toISOString(),
        latitude,
        longitude,
        address,
      });

      const created = res.data;

      toast.success("Ton événement est en ligne 🎉");
      
      setTimeout( () => {
            router.replace({
              pathname: "/events/[id]",
              params: { id: String(created.id) },
            });
      }, 500);
    } catch (err: any) {
      console.log(err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Impossible de créer l'événement pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.logo}>Loners</Text>
            <Text style={styles.subtitle}>Créer un événement</Text>
          </View>

          {/* FORM */}
          <View style={styles.card}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Titre de l'événement"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Type *
            </Text>
            <View style={styles.typeRow}>
              {["soirée", "expo", "concert", "autre"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    type === t && styles.typeChipActive,
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      type === t && styles.typeChipTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DATE & HEURE */}
            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Date & heure *
            </Text>
            <Text style={styles.helperText}>
              Choisis la date et l'heure de l'événement.
            </Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={showDatePickerModal}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.dateButtonText}>
                {date
                  ? date.toLocaleString()
                  : "Sélectionner une date et une heure"}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDateModalVisible}
              mode="datetime"
              date={date || new Date()}
              onConfirm={handleConfirmDate}
              onCancel={hideDatePickerModal}
            />

            {/* ADRESSE */}
            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Adresse *
            </Text>
            <Text style={styles.helperText}>
              Choisis une adresse dans les suggestions.
            </Text>
            <View style={styles.addressInputWrapper}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <TextInput
                value={addressQuery}
                onChangeText={(text) => {
                  setAddressQuery(text);
                  setAddress("");
                  setLatitude(null);
                  setLongitude(null);
                  fetchSuggestions(text);
                }}
                placeholder="Taper une adresse"
                placeholderTextColor={colors.textMuted}
                style={styles.addressInput}
              />
              {loadingSuggestions && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.place_id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(s)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={colors.textMuted}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.suggestionText}>
                      {s.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* DESCRIPTION */}
            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Description *
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Explique l'ambiance, le lieu, le style..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.textArea]}
              multiline
            />

            {latitude != null && longitude != null && (
              <View style={styles.coordsBox}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.coordsText}>
                  Lieu confirmé : {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              </View>
            )}
          </View>

          {/* SUBMIT */}
          <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
            <PrimaryButton
              title={loading ? "Création..." : "Créer l'événement"}
              onPress={handleCreate}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  logo: {
    ...typography.title,
    color: colors.text,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helperText: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeChipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  typeChipTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  dateButton: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
  },
  dateButtonText: {
    ...typography.body,
    color: colors.text,
  },
  addressInputWrapper: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
  },
  addressInput: {
    flex: 1,
    paddingVertical: spacing.xs,
    color: colors.text,
  },
  suggestionsContainer: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  coordsBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  coordsText: {
    ...typography.body,
    fontSize: 12,
    color: colors.primary,
  },
});