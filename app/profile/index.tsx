// app/profile/index.tsx
import { useToast } from "@/src/context/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../src/api/client";
import { BottomNav } from "../../src/components/BottomNav";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useAuth } from "../../src/context/AuthContext";
import { colors, radius, spacing, typography } from "../../src/styles/theme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showRadiusModal, setShowRadiusModal] = useState(false);
  const [updatingRadius, setUpdatingRadius] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const radiusOptions = [5, 10, 20, 50, 100];

  const handleSignOut = () => {
    Alert.alert(
      "Déconnexion",
      "Es-tu sûr de vouloir te déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion", style: "destructive", onPress: () => {
            signOut();
            toast.info("À bientôt !");
            setTimeout(() => {
              router.replace({
                pathname: "/"
              });
            }, 500);
          }
        },
      ]
    );
  };

  const handleUpdateRadius = async (newRadius: number) => {
    try {
      setUpdatingRadius(true);
      await api.patch("/auth/me", { radiusKm: newRadius });
      setShowRadiusModal(false);
      toast.success(`Ton rayon de recherche est maintenant de ${newRadius}km`);
      // Le user sera rechargé au prochain refresh de la liste
    } catch (err: any) {
      console.log("Error updating radius:", err);
      toast.error("Impossible de mettre à jour le rayon de recherche");
    } finally {
      setUpdatingRadius(false);
    }
  };

  const getInitials = (username: string) => {
    if (!username) return "?";
    const parts = username.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>Loners</Text>
          <Text style={styles.subtitle}>Mon profil</Text>
        </View>

        {/* PROFILE CARD */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.username || "")}
              </Text>
            </View>
          </View>

          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* SETTINGS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowRadiusModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons
                name="navigate-circle-outline"
                size={20}
                color={colors.text}
              />
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.settingText}>Rayon de recherche</Text>
                <Text style={styles.settingSubtext}>
                  {user?.radiusKm || 10} km
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Confidentialité</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* ABOUT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Aide & Support</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.text}
              />
              <Text style={styles.settingText}>Conditions d'utilisation</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* MODAL RAYON DE RECHERCHE */}
      <Modal
        visible={showRadiusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRadiusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRadiusModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Rayon de recherche</Text>
            <Text style={styles.modalSubtitle}>
              Choisis le rayon pour trouver des événements autour de toi
            </Text>

            <View style={styles.radiusOptions}>
              {radiusOptions.map((radius) => (
                <TouchableOpacity
                  key={radius}
                  style={[
                    styles.radiusOption,
                    user?.radiusKm === radius && styles.radiusOptionActive,
                  ]}
                  onPress={() => handleUpdateRadius(radius)}
                  disabled={updatingRadius}
                >
                  <Text
                    style={[
                      styles.radiusOptionText,
                      user?.radiusKm === radius &&
                      styles.radiusOptionTextActive,
                    ]}
                  >
                    {radius} km
                  </Text>
                  {user?.radiusKm === radius && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              title="Fermer"
              onPress={() => setShowRadiusModal(false)}
              variant="ghost"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.xl,
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
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    ...typography.title,
    fontSize: 32,
    color: "#FFFFFF",
  },
  username: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    ...typography.body,
    color: colors.text,
  },
  settingSubtext: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.label,
    color: colors.danger,
    marginLeft: spacing.sm,
  },
  version: {
    ...typography.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  radiusOptions: {
    marginBottom: spacing.lg,
  },
  radiusOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  radiusOptionActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  radiusOptionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
  },
  radiusOptionTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});