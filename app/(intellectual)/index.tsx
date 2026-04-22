import { Skeleton } from "@/components/ui/skeleton";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Intellectual from "../../assets/images/vector/intellectual_start.png";
import "../../global.css";

export default function CongratulationPage() {
  const router = useRouter();

  // 🛡️ NAVIGATION LOCKS
  const isProcessing = useRef(false);
  const [navigating, setNavigating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // RESET LOCKS ON FOCUS
  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  // Effect: Initial Page Load Simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const RegisteredProperty = () => {
    // ⛔ STRICT CLICK CHECK
    if (isProcessing.current || navigating) return;

    isProcessing.current = true;
    setNavigating(true);

    router.push("/registered");
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center py-14 px-6">
          <View className="w-full max-w-[500px] items-center">
            {/* 1. IMAGE SECTION */}
            {pageLoading ? (
              <Skeleton className="w-[250px] h-[250px] rounded-full mb-12" />
            ) : (
              <Image
                style={{ width: 280, height: 280 }}
                className="mb-12"
                source={Intellectual}
                resizeMode="contain"
              />
            )}

            {/* 2. TEXT CONTENT */}
            <View className="pb-8 w-full items-center">
              {pageLoading ? (
                <View className="gap-y-3 items-center">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-80" />
                  <Skeleton className="h-5 w-48" />
                </View>
              ) : (
                <>
                  <Text className="text-center font-bold text-primary text-2xl px-4">
                    Apply for intellectual property assistance
                  </Text>
                  <Text className="text-center text-slate-500 text-base pt-3">
                    to protect and secure your ideas,
                  </Text>
                  <Text className="text-center text-slate-500 text-base ">
                    creations, and innovation.
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 3. STRICT ACTION BUTTON (Footer) */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        {pageLoading ? (
          <Skeleton className="h-[60px] w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={RegisteredProperty}
            disabled={navigating}
            activeOpacity={0.8}
            className={`h-16 rounded-2xl justify-center items-center ${
              navigating ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {navigating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Get Started</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
