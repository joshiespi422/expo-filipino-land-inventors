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

    const configureSystemUI = async () => {
      if (Platform.OS === "android") {
        try {
          // Set behavior to sticky so swipes still work
          await NavigationBar.setBehaviorAsync("sticky-immersive");
          // Make the background transparent so the View's bg color shows through
          await NavigationBar.setBackgroundColorAsync("#ffffff00");
          // Position absolute allows the app to draw under the nav buttons
          await NavigationBar.setPositionAsync("absolute");
          // Hide it, but if it triggers, it's now transparent
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          console.log("NavigationBar error:", e);
        }
      }
    };

    configureSystemUI();
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
      {/* Ensure Status bar is translucent to match the theme */}
      <StatusBar
        style="light"
        translucent={true}
        backgroundColor="transparent"
      />
      <View className="flex-1 bg-slate-50">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
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
