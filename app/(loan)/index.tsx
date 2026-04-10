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
import loanAds from "../../assets/images/loanAds.jpg";

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
      router.push("/loanForm");
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
          <View className="w-full max-w-[500px] mx-auto">
            {/* Header Image */}
            <Image
              source={loanAds}
              className="!w-full !h-36 rounded-2xl"
              resizeMode="contain"
            />

            {/* Floating Card Section Container */}
            <View style={{ width: 295 }} className="mx-auto">
              {/* Card 1: Loanable Amount */}
              <View
                style={{
                  marginTop: -31,
                  zIndex: 50,
                  elevation: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                }}
                className="bg-white rounded-2xl border border-primary/20 p-4"
              >
                <Text className="text-primary text-md">Loanable Amount</Text>
                <Text className="text-primary text-3xl pt-2 font-bold">
                  ₱16,000.00
                </Text>
              </View>

              {/* Card 2: Loan Details */}
              <View
                style={{
                  elevation: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  marginTop: 20,
                }}
                className="bg-white rounded-2xl border border-primary/20"
              >
                <View className="flex-row justify-between">
                  <View className="p-4">
                    <Text className="text-md">Loan Details</Text>
                    <View className="flex-row gap-6 justify-between">
                      <View>
                        <Text className="text-primary text-md pt-2 font-bold">
                          Payable in
                        </Text>
                        <Text className="text-primary text-3xl pt-1 text-center font-bold">
                          12
                        </Text>
                        <Text className="text-primary text-md text-center">
                          Months
                        </Text>
                      </View>
                      <View>
                        <Text className="text-primary text-md pt-2 font-bold">
                          Interest rate
                        </Text>
                        <Text className="text-primary text-3xl pt-1 text-center font-bold">
                          0%
                        </Text>
                        <Text className="text-primary text-md text-center">
                          ave per mo.
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Help Badge Section */}
                  <View
                    style={{
                      width: 100,
                      borderTopEndRadius: 12,
                      borderBottomEndRadius: 12,
                    }}
                    className="bg-primary flex-row border-3 items-center justify-center"
                  >
                    <View className="items-center">
                      <Text className="text-white font-bold uppercase text-xl">
                        Need
                      </Text>
                      <Text
                        style={{ marginTop: -4 }}
                        className="text-white font-bold uppercase text-xl"
                      >
                        Help?
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* History / Status Text */}
              <View className="pt-12 pb-8">
                <Text className="text-center font-bold text-xl">
                  You have no Active Loan
                </Text>
              </View>
            </View>
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
                {navigating ? "Redirecting..." : "Get Started"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
