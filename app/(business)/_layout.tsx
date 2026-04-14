import { useAuthStore } from "@/store/useAuthStore"; // Import your store
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Redirect, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

const queryClient = new QueryClient();

export default function BusinessLayout() {
  const router = useRouter();
  const { token, isLoading } = useAuthStore(); // Access auth state

  useEffect(() => {
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

  // 1. LOADING GATE: Wait for SecureStore check
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  // 2. SECURITY GATE: If no token exists, send back to login
  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar hidden={true} />

      <View className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* --- GLOBAL HEADER --- */}
          <View className="bg-primary w-full items-center rounded-b-2xl pt-14 pb-4">
            <View className="flex-row justify-between gap-8 w-full px-6">
              <View>
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
              </View>
              <View>
                <Text className="text-white text-2xl font-bold">
                  Business Training
                </Text>
              </View>
              <View style={{ width: 28 }} />
            </View>
          </View>

          {/* --- MAIN CONTENT AREA --- */}
          <View className="flex-1">
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen name="index" />
              {/* Ensure sub-routes like 'category' or 'module' are handled here if necessary */}
            </Stack>
          </View>
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
