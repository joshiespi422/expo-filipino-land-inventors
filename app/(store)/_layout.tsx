import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, usePathname, useRouter } from "expo-router";
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

import HeartBlue from "../../assets/images/icon/heartblue.png";
import HeartGrey from "../../assets/images/icon/heartgrey.png";

import LikeBlue from "../../assets/images/icon/likeblue.png";
import LikeGrey from "../../assets/images/icon/likegrey.png";

import NotifBlue from "../../assets/images/icon/notifblue.png";
import NotifGrey from "../../assets/images/icon/notifgrey.png";

import ProfileBlue from "../../assets/images/icon/profileblue.png";
import ProfileGrey from "../../assets/images/icon/profilegrey.png";

import "../../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === "/home" || pathname === "/(store)/home";

  const isCollection =
    pathname === "/collection" || pathname === "/(store)/collection";

  const isNotification =
    pathname === "/notification" || pathname === "/(store)/notification";

  const isProfile = pathname === "/profile" || pathname === "/(store)/profile";

  const showFooter = isHome || isCollection || isNotification || isProfile;

  const isCart = pathname === "/cart";
  const isCheckout = pathname === "/checkout";
  const isOrrderList = pathname === "/order-list";
  const isChatList = pathname === "/chat-list";
  const isChatSeller = pathname === "/chat-seller";
  const isProducts = pathname === "/products";
  const isShop = pathname === "/store";

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
          {/* HEADER */}

          <View
            className="
            bg-primary
            w-full
            items-center
            rounded-b-2xl
            pt-14
            pb-4
            "
          >
            <View
              className="
              flex-row
              justify-between
              items-center
              w-full
              px-6
              "
            >
              <View className="w-[31px]">
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
              </View>

              <Text
                className="
                text-white
                text-2xl
                font-bold
                "
              >
                <Text className="text-white text-2xl font-bold">
                  {isCart
                    ? "Shopping Cart"
                    : isCheckout
                      ? "Checkout"
                      : isOrrderList
                        ? "My Purchases"
                        : isChatList
                          ? "Messages"
                          : isChatSeller
                            ? "Seller"
                            : isProducts
                              ? "Product"
                              : isShop
                                ? "Store Shop"
                                : "   FISMPC Online Store"}
                </Text>
              </Text>

              <View className="w-[31px]" />
            </View>
          </View>

          {/* CONTENT */}

          <View className="flex-1">
            <Stack
              screenOptions={{
                headerShown: false,

                animation: "fade",

                contentStyle: {
                  backgroundColor: "transparent",
                },
              }}
            >
              <Stack.Screen name="index" />
            </Stack>
          </View>

          {/* FOOTER */}

          {showFooter && (
            <View
              className="
  
                pb-4
                pt-3
                w-full
                bg-blue
                justify-center
                "
            >
              <View
                className="
                  flex-row
                  items-center
                  justify-around
                  w-full
                  "
              >
                {/* FOR YOU */}

                <TouchableOpacity
                  className="items-center flex-1"
                  onPress={() => router.push("/home")}
                >
                  <Image
                    source={isHome ? LikeBlue : LikeGrey}
                    style={{
                      width: 26,
                      height: 26,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    className={
                      isHome
                        ? "text-primary text-xs mt-2 font-bold"
                        : "text-gray-500 text-xs mt-2"
                    }
                  >
                    For you
                  </Text>
                </TouchableOpacity>

                {/* COLLECTION */}

                <TouchableOpacity
                  className="items-center flex-1"
                  onPress={() => router.push("/collection")}
                >
                  <Image
                    source={isCollection ? HeartBlue : HeartGrey}
                    style={{
                      width: 26,
                      height: 26,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    className={
                      isCollection
                        ? "text-primary text-xs mt-2 font-bold"
                        : "text-gray-500 text-xs mt-2"
                    }
                  >
                    Collection
                  </Text>
                </TouchableOpacity>

                {/* NOTIFICATION */}

                <TouchableOpacity
                  className="items-center flex-1"
                  onPress={() => router.push("/notification")}
                >
                  <Image
                    source={isNotification ? NotifBlue : NotifGrey}
                    style={{
                      width: 26,
                      height: 26,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    className={
                      isNotification
                        ? "text-primary text-xs mt-2 font-bold"
                        : "text-gray-500 text-xs mt-2"
                    }
                  >
                    Notification
                  </Text>
                </TouchableOpacity>

                {/* PROFILE */}

                <TouchableOpacity
                  className="items-center flex-1"
                  onPress={() => router.push("/(store)/profile")}
                >
                  <Image
                    source={isProfile ? ProfileBlue : ProfileGrey}
                    style={{
                      width: 26,
                      height: 26,
                    }}
                    resizeMode="contain"
                  />

                  <Text
                    className={
                      isProfile
                        ? "text-primary text-xs mt-2 font-bold"
                        : "text-gray-500 text-xs mt-2"
                    }
                  >
                    Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </QueryClientProvider>
  );
}
