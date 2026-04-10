import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

export default function LoginPage() {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);

  const isProcessing = useRef(false);

  const [isLoading, setIsLoading] = useState(false);
  const [navigating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleOtpSend = () => {
    if (isProcessing.current || isLoading || navigating) return;

    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/otpVerification");
    }, 800);
  };

  return (
    <View className="flex-1 bg-white">
      {/* 1. SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pb-10">
          <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
            {/* Header Image */}
            <View className="pb-8">
              <Text className="text-center font-bold text-primary text-2xl">
                Loan Amount
              </Text>
              <Text className="text-center text-md pt-2">
                Enter how much you would like to borrow
              </Text>
              <Text className="text-center text-md">
                within your eligible limit.
              </Text>
            </View>

            {/* <TouchableOpacity
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              className="flex-row ps-2 pt-5 items-center"
              activeOpacity={0.7}
              disabled={isLoading || navigating}
            >
              <View
                className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                  agreeToTerms
                    ? "bg-primary border-primary"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                {agreeToTerms && (
                  <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                )}
              </View>
              <Text className="text-primary text-sm">
                I agree to the{" "}
                <Text className="underline">Terms and Conditions</Text>
              </Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </ScrollView>

      {/* 2. FIXED BOTTOM BUTTON SECTION */}
      <View style={{ width: 305 }} className="pb-10 pt-5 bg-white mx-auto">
        <View className="w-full max-w-[500px] mx-auto">
          <TouchableOpacity
            onPress={handleOtpSend}
            disabled={isLoading || navigating}
            activeOpacity={0.8}
            className={`p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
              isLoading || navigating ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {navigating ? "Redirecting..." : "Submit Loan"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
