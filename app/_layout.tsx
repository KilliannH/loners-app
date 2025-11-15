// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function RootLayoutInner() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
  screenOptions={{
    headerShown: false,
  }}
>
  <Stack.Screen name="index" />
  <Stack.Screen name="events/index" />
  <Stack.Screen name="events/[id]" />
  <Stack.Screen name="events/[id]/chat" />
</Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
