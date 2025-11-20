// src/context/ToastContext.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { createContext, useContext, useState } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../styles/theme";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = (
    message: string,
    type: ToastType = "info",
    duration: number = 3000
  ) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, duration?: number) =>
    showToast(message, "success", duration);
  const error = (message: string, duration?: number) =>
    showToast(message, "error", duration);
  const info = (message: string, duration?: number) =>
    showToast(message, "info", duration);
  const warning = (message: string, duration?: number) =>
    showToast(message, "warning", duration);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      case "info":
        return "information-circle";
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "#10B981";
      case "error":
        return colors.danger;
      case "warning":
        return "#F59E0B";
      case "info":
        return colors.primary;
    }
  };

  return (
    <ToastContext.Provider
      value={{ showToast, success, error, info, warning }}
    >
      {children}

      {/* Toast Container */}
      <View
        style={[
          styles.toastContainer,
          { top: insets.top + spacing.md },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
            icon={getIcon(toast.type)}
            color={getColor(toast.type)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

type ToastItemProps = {
  toast: Toast;
  onDismiss: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  onDismiss,
  icon,
  color,
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>

      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>

      <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  toastText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
});

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};