import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import {
  Slot,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- NAVIGATION BAR WRAPPER ---
function NavigationBarWrapper({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const setupNavigationBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync("visible");
        await NavigationBar.setButtonStyleAsync("dark");
      } catch (error) {
        console.log("NavigationBar setup error:", error);
      }
    };

    setupNavigationBar();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ flex: 1 }}>{children}</View>

      {/* Solid white bottom bar covering Android Navigation Bar */}
      {Platform.OS === "android" && (
        <View style={{ height: insets.bottom, backgroundColor: "#ffffff" }} />
      )}
    </View>
  );
}

// --- CUSTOM HEADER COMPONENT ---
function CustomHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // --- ROUTE & HISTORY TRACKING ---
  const currentHref = useMemo(() => {
    const qs = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) acc[k] = String(v);
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, params]);

  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    const stack = historyRef.current;
    const top = stack[stack.length - 1];
    const belowTop = stack[stack.length - 2];

    if (top === currentHref) {
      // same screen re-render, ignore
      return;
    }
    if (belowTop === currentHref) {
      // moved BACK via swipe/hardware — sync stack by popping
      stack.pop();
      return;
    }
    // forward navigation — track it
    stack.push(currentHref);
  }, [currentHref]);

  // --- SMART BACK PRESS HANDLER ---
  const handleBackPress = () => {
    try {
      const stack = historyRef.current;

      if (stack.length > 1) {
        stack.pop();
        const prevHref = stack[stack.length - 1];
        router.replace(prevHref as any);
        return;
      }

      if (params.from === "home") {
        router.replace("/(main)");
        return;
      }

      router.replace("/(main)/profile");
    } catch (e) {
      console.error("❌ [Intellectual Back] Error:", e);
      router.replace("/(main)/profile");
    }
  };

  // --- ROUTE DISPLAY TITLE ---
  const isProfileEdit = pathname.includes("editProfile");
  const isProfileSetup = pathname.includes("setupProfile");
  const isCongratulations = pathname.includes("congratulations");
  const isChangePassword = pathname.includes("changePassword");

  const title = isProfileEdit
    ? "Edit Profile"
    : isProfileSetup
      ? "Setup Profile"
      : isCongratulations
        ? "Profile"
        : isChangePassword
          ? "Security & Password"
          : "";

  if (!title) return null;

  return (
    <View className="bg-primary w-full items-center rounded-b-2xl pt-14 pb-4">
      <View className="flex-row justify-between items-center w-full px-6">
        {/* Render back button ONLY if not on congratulations screen */}
        {!isCongratulations ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={{ width: 31 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 31 }} />
        )}

        <Text
          className="text-white text-2xl font-bold text-center flex-1"
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={{ width: 31 }} />
      </View>
    </View>
  );
}

// --- MAIN LAYOUT ---
export default function MainProfileLayout() {
  return (
    <NavigationBarWrapper>
      <StatusBar hidden={true} />
      <CustomHeader />
      <Slot />
    </NavigationBarWrapper>
  );
}
