import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // 🔥 Hide Android navigation bar (bottom buttons)
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("overlay-swipe");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* 🔥 Hide top status bar (time, battery, etc.) */}
      <StatusBar hidden />

      {/* 🔥 Applies to ALL pages */}
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
