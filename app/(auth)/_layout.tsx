import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import "../../global.css";

const queryClient = new QueryClient();

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { token, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize the token from SecureStore
    initialize();

    const hideNavBar = async () => {
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setBehaviorAsync("sticky-immersive" as any);
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          console.log("NavigationBar error:", e);
        }
      }
    };

    hideNavBar();
  }, []);

  // Redirect to main if token exists, UNLESS we are currently on the congratulations page
  useEffect(() => {
    // We use .some() to check if 'congratulations' exists in the route segments
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
      <StatusBar hidden={true} />
      <View className="flex-1 bg-slate-50">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "android" ? 40 : 0}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: "#f8fafc" },
            }}
          >
            <Stack.Screen name="login" options={{ animation: "fade" }} />
            <Stack.Screen
              name="register"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen name="otpSend" options={{ animation: "fade" }} />
            <Stack.Screen
              name="otpVerification"
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="successVerification"
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="createPassword"
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="congratulations"
              options={{ animation: "fade" }}
            />
          </Stack>
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
