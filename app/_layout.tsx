import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import logo from "../assets/images/logo.png";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    const hideNavBar = async () => {
      if (Platform.OS === "android") {
        try {
          // "sticky-immersive" allows the bar to reappear on swipe then auto-hide
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
        >
          {/* --- GLOBAL HEADER --- */}
          <View className="bg-primary z-10 w-full h-28 items-center justify-between pt-8">
            {/* LEFT ICON */}
            <View
              className="absolute start-0 bottom-[-34px] pe-2 py-2 ps-7 bg-white rounded-r-full shadow-brand"
              style={{ elevation: 8 }}
            >
              <View
                className="bg-white rounded-full border border-primary/20 p-2 shadow-brand"
                style={{ elevation: 4 }}
              >
                <Ionicons name="call" size={36} color="#034194" />
              </View>
            </View>

            {/* CENTER LOGO */}
            <View
              className="absolute bottom-[-43px] bg-white rounded-full shadow-brand"
              style={{ elevation: 6 }}
            >
              <Image source={logo} className="w-24 h-24" resizeMode="contain" />
            </View>

            {/* RIGHT ICON */}
            <View
              className="absolute end-0 bottom-[-34px] ps-2 py-2 pe-7 bg-white rounded-l-full shadow-brand"
              style={{ elevation: 8 }}
            >
              <View
                className="bg-white rounded-full border border-primary/20 p-2 shadow-brand"
                style={{ elevation: 4 }}
              >
                <Entypo name="message" size={36} color="#034194" />
              </View>
            </View>
          </View>

          {/* --- MAIN CONTENT AREA --- */}
          {/* Added pt-12 to prevent content from being hidden under the floating logo */}
          <View className="flex-1 pt-12">
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen name="index" />
            </Stack>
          </View>

          {/* --- GLOBAL FOOTER --- */}
          <View className="bg-white border-t border-slate-200 w-full py-4 items-center justify-center">
            <Text className="text-slate-500 text-xs">
              © 2026 Your Company Name
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
