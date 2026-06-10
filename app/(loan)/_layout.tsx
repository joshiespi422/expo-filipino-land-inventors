import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments() as string[];

  const isCongratulationsPage = segments.some((s) => s === "congratulations");
  const isSharedCapital =
    pathname === "/shared-breakdown" ||
    pathname === "/shared-checkout" ||
    pathname === "/shared-payment" ||
    pathname === "/shared-qrph";

  const isLoanIndex =
    segments.length === 0 ||
    segments[segments.length - 1] === "index" ||
    (segments.includes("(loan)") && segments.length === 1);

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

  const handleBackPress = () => {
    if (isLoanIndex) {
      router.replace("../(main)/");
      return;
    }
    router.back();
  };

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
              {/* --- DYNAMIC BACK BUTTON --- */}
              <View className="w-[31px]">
                {/* Back button is strictly hidden on the congratulations page */}
                {!isCongratulationsPage && (
                  <TouchableOpacity onPress={handleBackPress}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              <View>
                <Text className="text-white text-2xl font-bold">
                  {isSharedCapital ? "Shared Capital" : "Loan Assistance"}
                </Text>
              </View>

              <View className="w-[31px]"></View>

              {/* <View className="w-[31px] items-end">
                <Image
                  style={{ width: 31, height: 31 }}
                  source={loanNotif}
                  resizeMode="contain"
                />
              </View> */}
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
              <Stack.Screen name="congratulations" />
            </Stack>
          </View>
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
