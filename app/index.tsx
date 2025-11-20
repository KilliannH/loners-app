// app/index.tsx
import { useToast } from "@/src/context/ToastContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { useAuth } from "../src/context/AuthContext";
import { colors, radius, spacing, typography } from "../src/styles/theme";

export default function IndexScreen() {
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // pour register
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/events");
    }
  }, [user, router]);

  const handleSubmit = async () => {
    if (!email || !password || (mode === "register" && !username)) {
      toast.warning("Merci de remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        await signIn(email.trim(), password);
        toast.success("Connexion réussie !");
      } else {
        await signUp(email.trim(), username.trim(), password);
        toast.success("Compte créé avec succès !");
      }
    } catch (err: any) {
      console.log(err?.response?.data || err?.message);
      toast.error(err?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "login" ? "Content de te revoir" : "On t’emmène quelque part ?";

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Loners</Text>
          <Text style={styles.tagline}>Sors solo, jamais vraiment seul.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>
            {mode === "login"
              ? "Connecte-toi pour trouver des événements autour de toi."
              : "Crée ton compte et rejoins des soirées, expos, concerts..."}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@exemple.com"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="loner_paris"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton
              title={
                loading
                  ? "..."
                  : mode === "login"
                  ? "Se connecter"
                  : "Créer mon compte"
              }
              onPress={handleSubmit}
              loading={loading}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === "login"
                ? "Pas encore de compte ? "
                : "Tu as déjà un compte ? "}
            </Text>
            <Text
              style={styles.switchLink}
              onPress={() =>
                setMode((m) => (m === "login" ? "register" : "login"))
              }
            >
              {mode === "login" ? "Inscription" : "Connexion"}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kav: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: "center",
  },
  header: {
    marginBottom: spacing.xl,
  },
  logo: {
    ...typography.title,
    fontSize: 32,
    color: colors.text,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  switchText: {
    ...typography.body,
    color: colors.textMuted,
  },
  switchLink: {
    ...typography.body,
    color: colors.accent,
    fontWeight: "600",
  },
});
