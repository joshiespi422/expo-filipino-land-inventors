import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import loanNotif from "../../assets/images/icon/loanNotif.png";

import "../../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
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
            <View className="flex-row justify-between w-full px-6 items-center">
              <View>
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
              </View>
              <View>
                <Text className="text-white text-2xl font-bold">
                  Loan Assistance
                </Text>
              </View>
              <View>
                <Image
                  style={{
                    width: 31,
                    height: 31,
                  }}
                  source={loanNotif}
                  resizeMode="contain"
                />
              </View>
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
            </Stack>
          </View>
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
