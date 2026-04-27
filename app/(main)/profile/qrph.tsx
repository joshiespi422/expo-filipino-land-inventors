import { checkPaymentStatus } from "@/services/loanService"; // Or membership equivalent
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, View } from "react-native";

export default function QRPaymentPage() {
  const { qrUrl, paymentIntentId } = useLocalSearchParams();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const hasShownSuccess = useRef(false);

  useEffect(() => {
    if (!paymentIntentId) return;

    pollingInterval.current = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(paymentIntentId as string);
        const status = Number(res?.status);

        // Status 11 = PAID in your system
        if (status === 11 && !hasShownSuccess.current) {
          hasShownSuccess.current = true;
          if (pollingInterval.current) clearInterval(pollingInterval.current);

          Alert.alert("Success", "Payment successful!", [
            {
              text: "OK",
              onPress: () => router.replace("/profile/membership-breakdown"),
            },
          ]);
        }
      } catch (err) {
        console.log("🔄 Polling status...", err);
      }
    }, 3000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [paymentIntentId]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <View className="bg-slate-50 p-8 rounded-[40px] items-center border border-slate-100">
        <Text className="text-2xl font-black text-slate-800 mb-2">
          Scan QR Ph
        </Text>
        <Text className="text-slate-500 text-center mb-8">
          Use your banking or e-wallet app to scan and pay.
        </Text>

        <View className="bg-white p-4 rounded-3xl shadow-xl">
          {qrUrl ? (
            <Image
              source={{ uri: qrUrl as string }}
              style={{ width: 260, height: 260 }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{ width: 260, height: 260 }}
              className="justify-center items-center"
            >
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          )}
        </View>

        <View className="flex-row items-center mt-10">
          <ActivityIndicator size="small" color="#64748b" />
          <Text className="ml-3 text-slate-500 font-medium">
            Waiting for confirmation...
          </Text>
        </View>
      </View>

      <Text className="absolute bottom-12 text-slate-400 text-xs text-center px-10">
        Do not close this screen until the payment is confirmed.
      </Text>
    </View>
  );
}
