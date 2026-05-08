import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, StatusBar, View } from "react-native";
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
          // 🔥 TRUE FULLSCREEN MODE
          await NavigationBar.setBehaviorAsync("sticky-immersive");
          await NavigationBar.setBackgroundColorAsync("#00000000");
          await NavigationBar.setPositionAsync("absolute");

          // optional (better fullscreen effect)
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          console.log("NavigationBar error:", e);
        }
      }
    };

    configureSystemUI();

    // 🔥 THIS IS THE IMPORTANT PART (FOR STATUS BAR)
    if (Platform.OS === "android") {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setBarStyle("light-content");
    }
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
      {/* 🔥 FULLSCREEN STATUS BAR CONTROL */}
      <ExpoStatusBar style="light" translucent />

      <View className="flex-1 bg-slate-50">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: {
              backgroundColor: "#f8fafc",
              paddingTop: 0,
            },
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
