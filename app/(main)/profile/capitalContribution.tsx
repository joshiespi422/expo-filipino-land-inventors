import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CongratulationPage() {
  const router = useRouter();
  const isProcessing = useRef(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleReturnHome = () => {
    if (isProcessing.current || navigating) return;

    isProcessing.current = true;
    setNavigating(true);

    // Use replace instead of push to prevent going back to the setup forms
    setTimeout(() => {
      router.replace("/(main)");
    }, 500);
  };

  return (
    <View className="flex-1 bg-white pt-12">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center py-1b px-6">
          <View className="w-full max-w-[500px] items-center">
            <View className="pb-6 w-full items-center">
              {pageLoading ? (
                <View className="gap-y-3 items-center">
                  <Skeleton className="h-10 w-56" />
                  <Skeleton className="h-20 w-72" />
                </View>
              ) : (
                <>
                  <View className="bg-primary w-full rounded-lg py-3">
                    <Text className="text-center font-bold text-white text-xl">
                      Capital Contribution
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="w-full p-5 bg-white border-t border-slate-200">
        {pageLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={handleReturnHome}
            disabled={navigating}
            activeOpacity={0.8}
            className={`h-16 rounded-2xl justify-center items-center ${
              navigating ? "bg-slate-400" : "bg-[#034194]"
            }`}
          >
            {navigating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">Back to Home</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
