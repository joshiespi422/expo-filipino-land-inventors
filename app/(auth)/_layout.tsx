import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import "../../global.css";

const queryClient = new QueryClient();

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { token, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();

    const hideNavBar = async () => {
      if (Platform.OS === "android") {
        try {
          // Using "padding" behavior usually avoids the black gap
          // but we set behavior to 'sticky-immersive' for the system bars
          await NavigationBar.setBehaviorAsync("sticky-immersive");
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          console.log("NavigationBar error:", e);
        }
      }
    };

    hideNavBar();
  }, []);

  useEffect(() => {
    const isCongratsPage = segments.some((s) => s.includes("congratulations"));
    if (!isLoading && token && !isCongratsPage) {
      router.replace("/(main)");
    }
  }, [isLoading, token, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Set hidden to true and ensure the background matches */}
      <StatusBar hidden={true} />
      <View className="flex-1 bg-slate-50">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            // This ensures the background color is consistent during keyboard shifts
            contentStyle: { backgroundColor: "#f8fafc" },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen
            name="register"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen name="otpSend" />
          <Stack.Screen name="otpVerification" />
          <Stack.Screen name="successVerification" />
          <Stack.Screen name="createPassword" />
          <Stack.Screen name="congratulations" />
        </Stack>
      </View>
    </QueryClientProvider>
  );
}
