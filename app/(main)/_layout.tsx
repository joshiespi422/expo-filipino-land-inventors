import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import Profile from "../../assets/images/icon/profile.png";
import logo from "../../assets/images/logo.png";

import "../../global.css";

const queryClient = new QueryClient();

export default function MainLayout() {
  const { token, isLoading, initialize, clearAuth } = useAuthStore();

  useEffect(() => {
    // Ensure the store is synchronized with SecureStore on mount
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

  // Logout Confirmation Handler
  const handleLogoutPress = () => {
    Alert.alert("Logout", "Are you sure you want to log out of your account?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
        },
      },
    ]);
  };

  // 1. LOADING GATE: Prevents the Redirect from firing while checking SecureStore
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  // 2. SECURITY GATE: Redirect to login if NO token exists after loading is done
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
          <View className="bg-primary z-10 w-full h-28 items-center justify-between pt-8">
            {/* LEFT ICON (Call) */}
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

            {/* CENTER LOGO */}
            <View
              className="absolute bottom-[-43px] bg-white rounded-full shadow-brand"
              style={{ elevation: 6 }}
            >
              <Image
                source={logo}
                className="!w-24 !h-24"
                resizeMode="contain"
              />
            </View>

            {/* RIGHT ICON (Message) */}
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

          {/* --- MAIN CONTENT AREA --- */}
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
              {/* Home */}
              <TouchableOpacity
                className="items-center flex-1"
                activeOpacity={0.7}
              >
                <Image
                  style={{ width: 31, height: 31 }}
                  source={Home}
                  resizeMode="contain"
                />
                <Text className="text-white text-[10px] mt-1">Home</Text>
              </TouchableOpacity>

              {/* Status */}
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

              {/* Central Camera Action */}
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

              {/* History */}
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

              {/* Logout/Profile */}
              <TouchableOpacity
                className="items-center flex-1"
                activeOpacity={0.7}
                onPress={handleLogoutPress}
              >
                <Image
                  style={{ width: 31, height: 31 }}
                  source={Profile}
                  resizeMode="contain"
                />
                <Text className="text-white text-[10px] mt-1">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
