// src/components/BottomNav.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../styles/theme";

type NavItem = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  route: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    name: "events",
    icon: "compass-outline",
    iconActive: "compass",
    route: "/events",
    label: "Explorer",
  },
  {
    name: "create",
    icon: "add-circle-outline",
    iconActive: "add-circle",
    route: "/events/create",
    label: "Créer",
  },
  {
    name: "profile",
    icon: "person-outline",
    iconActive: "person",
    route: "/profile",
    label: "Profil",
  },
];

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const getIsActive = (route: string) => {
    if (route === "/events") {
      return pathname === "/events" || pathname === "/events/";
    }
    return pathname.startsWith(route);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === "ios" ? insets.bottom : spacing.sm,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = getIsActive(item.route);
        return (
          <Pressable
            key={item.name}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && styles.iconWrapperActive,
              ]}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={24}
                color={isActive ? colors.primary : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  itemPressed: {
    opacity: 0.6,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: colors.surfaceAlt,
  },
  label: {
    ...typography.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});