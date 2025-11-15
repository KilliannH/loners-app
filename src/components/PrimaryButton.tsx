// src/components/PrimaryButton.tsx
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, typography } from "../styles/theme";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export const PrimaryButton: React.FC<Props> = ({
  title,
  onPress,
  loading,
  variant = "primary",
}) => {
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        isGhost && styles.buttonGhost,
        pressed && !loading && (isGhost ? styles.buttonGhostPressed : styles.buttonPressed),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? colors.text : "#FFF"} />
      ) : (
        <Text
          style={[
            styles.text,
            isGhost && styles.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    backgroundColor: colors.primarySoft,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonGhostPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  text: {
    ...typography.label,
    color: "#FFF",
  },
  textGhost: {
    color: colors.textMuted,
  },
});
