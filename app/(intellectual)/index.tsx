import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  const isProcessing = useRef(false);

  // States
  const [pageLoading, setPageLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  // Effect: Initial Page Load Simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const RegisteredProperty = () => {
    if (isProcessing.current || navigating) return;
    isProcessing.current = true;
    setNavigating(true);

    setTimeout(() => {
      router.push("/registered");
    }, 500);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center py-14 px-6">
          <View className="w-full max-w-[500px] items-center">
            {/* 1. SUCCESS IMAGE SKELETON */}
            {pageLoading ? (
              <Skeleton className="w-[200px] h-[200px] rounded-full mb-12" />
            ) : (
              <Image
                style={{ width: 280, height: 280 }}
                className="mb-12"
                source={Intellectual}
                resizeMode="contain"
              />
            )}

            {/* 2. HEADER & MESSAGE */}
            <View className="pb-8 w-full items-center">
              {pageLoading ? (
                <View className="gap-y-3 items-center">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-80" />
                  <Skeleton className="h-5 w-48" />
                </View>
              ) : (
                <>
                  <Text className="text-center font-bold text-primary text-2xl">
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

      {/* 4. FOOTER ACTION BUTTON */}
      <View className="px-6 pb-10 pt-5 bg-white shadow-2xl max-w-[500px] w-full self-center">
        {pageLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={RegisteredProperty}
            disabled={navigating}
            activeOpacity={0.8}
            className={`p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
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
