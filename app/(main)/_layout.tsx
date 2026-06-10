import { useAuthStore } from "@/store/useAuthStore";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as NavigationBar from "expo-navigation-bar";

import History from "../../assets/images/icon/History.png";
import Home from "../../assets/images/icon/Home.png";
import Status from "../../assets/images/icon/Status.png";
import Camera from "../../assets/images/icon/camera.png";
import logo from "../../assets/images/logo.png";

import "../../global.css";

const queryClient = new QueryClient();

export default function MainLayout() {
  const { token, isLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ NEW: modal state
  const [comingSoonVisible, setComingSoonVisible] = useState(false);

  const isMainIndex =
    pathname === "/" || pathname === "/(main)" || pathname === "/(main)/";

  const isProfileIndex =
    pathname === "/profile" || pathname === "/(main)/profile";
  const isProfileCongrats = pathname === "/profile/congratulations";
  const isProfileEdit = pathname === "/profile/editProfile";
  const isProfileSetup = pathname === "/profile/setupProfile";
  const isMembership = pathname === "/profile/membership";
  const isMembershipFee = pathname === "/profile/membership-breakdown";
  const isMembershipPay = pathname === "/profile/membership-checkout";
  const isMembershipQr = pathname === "/profile/membership-qrph";
  const isChangePassword = pathname === "/profile/changePassword";
  const isNewsIndex = pathname === "/news";
  const isNewsDetails = pathname === "/news/details";
  const isNewsSearch = pathname === "/news/search";
  const isLoadWallet = pathname === "/load";

  const isHistory = pathname === "/history";
  const isCameraQr = pathname === "/camera";

  const isWelcomePage =
    pathname === "/welcomePage" || pathname === "/(main)/welcomePage";

  const showFooter = isMainIndex || isProfileIndex;

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

  const handleComingSoon = () => {
    setComingSoonVisible(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar hidden={true} />

      {/* ✅ MODAL */}
      <Modal
        // transparent
        // visible={comingSoonVisible}
        // animationType="fade"
        // onRequestClose={() => setComingSoonVisible(false)}

        animationType="fade"
        transparent={true}
        visible={comingSoonVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setComingSoonVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "80%",
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            {/* <Ionicons name="time-outline" size={50} color="#034194" /> */}

            <Text className="text-xl font-bold text-center mb-3 text-primary">
              Coming Soon
            </Text>

            <View className="mb-6 px-2">
              <Text className="text-slate-500 text-center leading-6">
                This feature is not available yet. Please wait for future
                updates.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setComingSoonVisible(false)}
              className="bg-primary w-full py-4 rounded-2xl active:opacity-90"
            >
              <Text className="text-white text-center font-bold text-lg">
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* --- GLOBAL HEADER --- */}
          {isWelcomePage ? null : isMainIndex ? (
            <View className="bg-primary mb-12 z-10 w-full h-28 items-center justify-between pt-8">
              <View
                className="absolute start-0 bottom-[-34px] pe-2 py-2 ps-7 bg-white rounded-r-full shadow-brand"
                style={{ elevation: 8 }}
              >
                <TouchableOpacity onPress={handleComingSoon}>
                  <View className="bg-white rounded-full border border-primary/20 p-2 shadow-brand">
                    <Ionicons name="call" size={35} color="#034194" />
                  </View>
                </TouchableOpacity>
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
                <TouchableOpacity onPress={handleComingSoon}>
                  <View className="bg-white rounded-full border border-primary/20 p-2 shadow-brand">
                    <Entypo name="message" size={35} color="#034194" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : isCameraQr ? null : (
            <View className="bg-primary w-full items-center rounded-b-2xl pt-14 pb-4">
              <View className="flex-row justify-between items-center w-full px-6">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="w-[31px]"
                >
                  <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>

                <Text className="text-white text-2xl font-bold">
                  {isProfileIndex || isProfileCongrats
                    ? "Profile"
                    : isProfileEdit
                      ? "Edit Profile"
                      : isProfileSetup
                        ? "Setup Profile"
                        : isMembership
                          ? "Membership"
                          : isMembershipFee
                            ? "Membership Fee"
                            : isMembershipPay
                              ? "Checkout"
                              : isMembershipQr
                                ? "Payment QR"
                                : isHistory
                                  ? "Transaction History"
                                  : isChangePassword
                                    ? "Security & Password"
                                    : isNewsIndex
                                      ? "News & Events"
                                      : isNewsDetails
                                        ? "News Details"
                                        : isNewsSearch
                                          ? "Search News"
                                          : isLoadWallet
                                            ? "Load Wallet"
                                            : ""}
                </Text>

                {/* <View style={{ width: 28 }} /> */}
                <View className="w-[31px]"></View>
              </View>
            </View>
          )}

          {/* --- MAIN CONTENT --- */}
          <View className="flex-1">
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="profile/index"
                options={{ animation: "fade" }}
              />
              <Stack.Screen name="news/index" options={{ animation: "fade" }} />
              <Stack.Screen
                name="news/search"
                options={{ animation: "fade" }}
              />
              <Stack.Screen
                name="history/index"
                options={{ animation: "fade" }}
              />
              <Stack.Screen
                name="news/details"
                options={{ animation: "fade" }}
              />
              <Stack.Screen name="load/index" options={{ animation: "fade" }} />
            </Stack>
          </View>

          {/* --- FOOTER --- */}
          {showFooter && (
            <View
              style={{
                borderTopWidth: 5,
                borderTopColor: "#D70127",
                width: "100%",
                height: 80,
                zIndex: 99,
              }}
              className="justify-center bg-primary items-center"
            >
              <View className="flex-row w-full max-w-[600px] px-4 items-center">
                {/* Home */}
                <TouchableOpacity
                  className="items-center flex-1"
                  onPress={() => router.push("/")}
                >
                  <Image source={Home} style={{ width: 31, height: 31 }} />
                  <Text className="text-white text-[10px] mt-1">Home</Text>
                </TouchableOpacity>

                {/* STATUS - COMING SOON */}
                <TouchableOpacity
                  className="items-center pe-2 flex-1"
                  onPress={handleComingSoon}
                >
                  <Image source={Status} style={{ width: 31, height: 31 }} />
                  <Text className="text-white text-[10px] mt-1">Status</Text>
                </TouchableOpacity>

                {/* CAMERA */}
                <View
                  className="flex-1 items-center justify-center"
                  style={{ height: 50 }}
                >
                  <TouchableOpacity
                    onPress={() => router.push("/camera")}
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
                    }}
                  >
                    <Image source={Camera} style={{ width: 50, height: 50 }} />
                  </TouchableOpacity>
                </View>

                {/* HISTORY - COMING SOON */}
                <TouchableOpacity
                  className="items-center ps-2 flex-1"
                  onPress={() => router.push("/history")}
                >
                  <Image source={History} style={{ width: 31, height: 31 }} />
                  <Text className="text-white text-[10px] mt-1">History</Text>
                </TouchableOpacity>

                {/* PROFILE */}
                <TouchableOpacity
                  className="items-center flex-1"
                  onPress={() => router.push("/profile")}
                >
                  <View className="w-[31px] h-[31px]">
                    {user?.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <Ionicons name="person-circle" size={33} color="white" />
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
