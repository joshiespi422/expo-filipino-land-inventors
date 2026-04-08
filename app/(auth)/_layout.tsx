import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import "../../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    const hideNavBar = async () => {
      if (Platform.OS === "android") {
        try {
          // Changed to "as any" to force the red line to disappear
          await NavigationBar.setBehaviorAsync("sticky-immersive" as any);
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          console.log("NavigationBar error:", e);
        }
      }
    };

    hideNavBar();
  }, []);

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
