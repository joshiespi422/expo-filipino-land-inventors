import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CongratulationsImg from "../../assets/images/vector/Congratulations.png";
import "../../global.css";

export default function CongratulationsPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { token, user } = useLocalSearchParams<{
    token: string;
    user: string;
  }>();

  const isProcessing = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    if (isProcessing.current || isLoading) return;
    isProcessing.current = true;
    setIsLoading(true);

    try {
      // DEBUG: Check what the token actually looks like
      console.log("Token received from params:", token);

      if (token && user) {
        const userData = typeof user === "string" ? JSON.parse(user) : user;

        await setAuth(token, userData);

        console.log("Auth Store updated. Moving to Dashboard...");

        setTimeout(() => {
          router.replace("/(main)");
        }, 200);
      } else {
        console.error("No token or user data found in params.");
        router.replace("/login");
      }
    } catch (error) {
      console.error("Transition Error:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
      isProcessing.current = false;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
    >
      <View className="flex-1 bg-slate-50">
        <HeaderAuth title="Join Us" />
        <View className="flex-1 -mt-10">
          <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />
          <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
            <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4">
              {pageLoading ? (
                <View className="items-center mb-4">
                  <View className="mt-[-76px] bg-white rounded-full shadow-sm">
                    <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />
                  </View>
                </View>
              ) : (
                <LogoAuth />
              )}

              {pageLoading ? (
                <View className="gap-y-6">
                  <Skeleton className="h-52 w-full rounded-3xl mt-3" />
                  <View className="items-center gap-y-3">
                    <Skeleton className="h-10 w-64 rounded-lg" />
                    <View className="items-center gap-y-2 w-full">
                      <Skeleton className="h-3 w-[85%] rounded-md" />
                      <Skeleton className="h-3 w-[90%] rounded-md" />
                      <Skeleton className="h-3 w-[60%] rounded-md" />
                    </View>
                  </View>
                  <Skeleton className="h-[64px] w-full rounded-2xl my-5" />
                </View>
              ) : (
                <>
                  <View className="pt-3 items-center">
                    <Image
                      source={CongratulationsImg}
                      className="h-52 w-full"
                      resizeMode="contain"
                    />
                  </View>
                  <TitleAuth
                    title="Congratulations!!!"
                    containerClass="mb-5 mt-4"
                    description={
                      <View>
                        <Text className="text-center text-slate-900 text-sm">
                          Your account has been successfully created.
                        </Text>
                        <Text className="text-center text-slate-900 text-sm mt-1">
                          kindly{" "}
                          <Text className="font-bold">
                            proceed to your profile to complete{" "}
                          </Text>
                          Verification <Text className="font-light">and</Text>{" "}
                          gain full access to our services
                        </Text>
                      </View>
                    }
                  />
                  <TouchableOpacity
                    onPress={handleContinue}
                    disabled={isLoading}
                    className={`my-5 py-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      isLoading ? "bg-slate-400" : "bg-primary"
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg text-center">
                        Go to Dashboard
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
