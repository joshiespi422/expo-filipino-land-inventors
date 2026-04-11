import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import loangrats from "../../assets/images/loangrats.png";
import "../../global.css";

export default function CongratulationPage() {
  const router = useRouter();
  const isProcessing = useRef(false);
  const [navigating, setNavigating] = useState(false);

  // --- DATABASE CONFIGURATION ---
  // In the future, you can fetch these values from your database
  const APPLIED_AMOUNT = 16000;

  const handleReturnHome = () => {
    if (isProcessing.current || navigating) return;
    isProcessing.current = true;
    setNavigating(true);

    // Short delay for a smoother transition
    setTimeout(() => {
      router.push("../");
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
            {/* 1. SUCCESS IMAGE */}
            <Image
              style={{ width: 200, height: 200 }}
              className="mb-14"
              source={loangrats}
              resizeMode="contain"
            />

            {/* 2. HEADER & MESSAGE */}
            <View className="pb-8">
              <Text className="text-center font-bold text-primary text-3xl">
                Congratulations!
              </Text>
              <Text className="text-center text-slate-500 text-base pt-3 leading-6">
                Your loan application for{" "}
                <Text className="font-bold text-primary">
                  ₱
                  {APPLIED_AMOUNT.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>{" "}
                has been successfully submitted.
              </Text>
            </View>

            {/* 3. NEXT STEPS CARD */}
            <View className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
              <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                What happens next?
              </Text>

              {/* Step 1 */}
              <View className="flex-row mb-5">
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">1</Text>
                </View>
                <Text className="flex-1 text-slate-600 text-sm leading-5">
                  Our team is currently{" "}
                  <Text className="font-bold">reviewing</Text> your loan details
                  and documents.
                </Text>
              </View>

              {/* Step 2 */}
              <View className="flex-row">
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3">
                  <Text className="text-white text-xs font-bold">2</Text>
                </View>
                <Text className="flex-1 text-slate-600 text-sm leading-5">
                  Please{" "}
                  <Text className="font-bold">wait for a notification</Text> or
                  SMS. We will alert you once your loan is approved.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 5. FOOTER ACTION BUTTON */}
      <View className="px-6 pb-10 bg-white shadow-2xl max-w-[500px] w-full self-center">
        <TouchableOpacity
          onPress={handleReturnHome}
          disabled={navigating}
          activeOpacity={0.8}
          className={`p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
            navigating ? "bg-slate-400" : "bg-primary"
          }`}
        >
          {navigating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Return to Home</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
