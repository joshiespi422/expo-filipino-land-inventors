import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Asset Imports
import History from "../../assets/images/icon/History.png";
import Home from "../../assets/images/icon/Home.png";
import Status from "../../assets/images/icon/Status.png";
import Camera from "../../assets/images/icon/camera.png";
import logo from "../../assets/images/logo.png";

import "../../global.css";

const queryClient = new QueryClient();

export default function MainLayout() {
  const { token, isLoading, initialize, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // --- Logic for Main Index ---
  // Check for Home
  const isMainIndex = pathname === "/";

  // Check for Profile: This catches "/profile" and "/profile/"
  const isProfileIndex = pathname === "/profile" || pathname === "/profile/";

  const showFooter = isMainIndex || isProfileIndex;

  // STICKY HIDE FUNCTION
  const forceHideNavBar = async () => {
    if (Platform.OS === "android") {
      try {
        await NavigationBar.setBehaviorAsync("sticky-immersive");
        await NavigationBar.setVisibilityAsync("hidden");
      } catch (e) {
        console.log("NavigationBar error:", e);
      }
    }
  };

  useEffect(() => {
    initialize();
    forceHideNavBar();

    const interval = setInterval(forceHideNavBar, 2000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar hidden={true} translucent={true} />

      <View className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* --- GLOBAL HEADER --- */}
          {isMainIndex ? (
            /* Main index only shows this */
            <View className="bg-primary mb-12 z-10 w-full h-28 items-center justify-between pt-8">
              <View
                className="absolute start-0 bottom-[-34px] pe-2 py-2 ps-7 bg-white rounded-r-full shadow-brand"
                style={{ elevation: 8 }}
              >
                <View
                  className="bg-white rounded-full border border-primary/20 p-2 shadow-brand"
                  style={{ elevation: 4 }}
                >
                  <Ionicons name="call" size={35} color="#034194" />
                </View>
              </View>

              <View
                className="absolute bottom-[-43px] bg-white rounded-full shadow-brand"
                style={{ elevation: 6 }}
              >
                <Image
                  source={logo}
                  style={{ width: 96, height: 96 }}
                  resizeMode="contain"
                />
              </View>

              <View
                className="absolute end-0 bottom-[-34px] ps-2 py-2 pe-7 bg-white rounded-l-full shadow-brand"
                style={{ elevation: 8 }}
              >
                <View
                  className="bg-white rounded-full border border-primary/20 p-2 shadow-brand"
                  style={{ elevation: 4 }}
                >
                  <Entypo name="message" size={35} color="#034194" />
                </View>
              </View>
            </View>
          ) : (
            /* Sub-pages like Profile show this */
            <View className="bg-primary w-full items-center rounded-b-2xl pt-14 pb-4">
              <View className="flex-row justify-between items-center w-full px-6">
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-2xl font-bold">
                  {pathname.includes("profile") ? "Profile" : ""}
                </Text>

                <View style={{ width: 28 }} />
              </View>
            </View>
          )}

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
              <Stack.Screen name="profile/index" />
            </Stack>
          </View>

          {/* --- GLOBAL FOOTER --- */}
          {showFooter && (
            <View
              style={{
                borderTopWidth: 5,
                borderTopColor: "#D70127",
                width: "100%",
                height: 80,
                overflow: "visible",
                zIndex: 99,
              }}
              className="justify-center bg-primary items-center"
            >
              <View
                className="flex-row w-full max-w-[600px] px-4 items-center"
                style={{ overflow: "visible" }}
              >
                <TouchableOpacity
                  className="items-center flex-1"
                  activeOpacity={0.7}
                  onPress={() => router.push("/")}
                >
                  <Image
                    style={{ width: 31, height: 31 }}
                    source={Home}
                    resizeMode="contain"
                  />
                  <Text className="text-white text-[10px] mt-1">Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center pe-2 flex-1"
                  activeOpacity={0.7}
                >
                  <Image
                    style={{ width: 31, height: 31 }}
                    source={Status}
                    resizeMode="contain"
                  />
                  <Text className="text-white text-[10px] mt-1">Status</Text>
                </TouchableOpacity>

                <View
                  className="flex-1 items-center justify-center"
                  style={{
                    overflow: "visible",
                    position: "relative",
                    height: 50,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{
                      position: "absolute",
                      top: -43,
                      width: 85,
                      height: 85,
                      borderRadius: 45,
                      backgroundColor: "white",
                      borderWidth: 3,
                      borderColor: "#C6890F",
                      alignItems: "center",
                      justifyContent: "center",
                      elevation: 10,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 5 },
                      shadowOpacity: 0.3,
                      shadowRadius: 5,
                    }}
                  >
                    <Image
                      source={Camera}
                      style={{ width: 53, height: 53 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="items-center ps-2 flex-1"
                  activeOpacity={0.7}
                >
                  <Image
                    style={{ width: 31, height: 31 }}
                    source={History}
                    resizeMode="contain"
                  />
                  <Text className="text-white text-[10px] mt-1">History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="items-center flex-1"
                  activeOpacity={0.7}
                  onPress={() => router.push("/profile")}
                >
                  <View className="w-[31px] h-[31px] items-center justify-center">
                    {user?.avatar ? (
                      <View className="w-full h-full rounded-full overflow-hidden border border-white/30">
                        <Image
                          source={{ uri: user.avatar }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <Ionicons name="person-circle" size={31} color="white" />
                    )}
                  </View>
                  <Text className="text-white text-[10px] mt-1">Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
