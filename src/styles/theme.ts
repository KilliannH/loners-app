// src/styles/theme.ts
export const colors = {
  background: "#F7F9FC",     // fond très clair, légèrement bleuté
  surface: "#FFFFFF",        // cartes très claires
  surfaceAlt: "#F1F5F9",     // légère variante pour sections
  primary: "#6366F1",        // violet / indigo moderne
  primarySoft: "#818CF8",    // version plus douce
  accent: "#FB923C",         // orange doux (peut être utilisé pour CTA)
  text: "#111827",           // texte principal foncé
  textMuted: "#6B7280",      // texte secondaire gris neutre
  border: "#E2E8F0",         // contours très doux
  danger: "#DC2626",         // rouge classique (pas trop saturé)
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
};