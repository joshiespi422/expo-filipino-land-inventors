import { checkMembershipPaymentStatus } from "@/services/membershipService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Image, Text, View } from "react-native";

export default function QRPaymentPage() {
  const { qrUrl, paymentIntentId } = useLocalSearchParams();
  const router = useRouter();

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const hasShownSuccess = useRef(false);

  useEffect(() => {
    if (!paymentIntentId) return;

    pollingInterval.current = setInterval(async () => {
      try {
        const res = await checkMembershipPaymentStatus(
          paymentIntentId as string,
        );

        console.log("🔄 FULL RESPONSE:", res);

        // NOW DIRECT ACCESS (NO .data)
        const rawStatus = res?.status;

        const status = Number(rawStatus);

        console.log("🔄 PARSED STATUS:", status);

        // SUCCESS CHECK (11 = paid)
        const isSuccess = status === 11;

        if (isSuccess && !hasShownSuccess.current) {
          hasShownSuccess.current = true;

          clearInterval(pollingInterval.current!);

          Alert.alert("Success", "Payment successful!", [
            {
              text: "OK",
              onPress: () => router.replace("/(main)"),
            },
          ]);
        }
      } catch (err) {
        console.log("Polling error:", err, paymentIntentId);
      }
    }, 2000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [paymentIntentId]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-xl font-bold mb-4">Scan to Pay</Text>

      {qrUrl ? (
        <Image
          source={{ uri: qrUrl as string }}
          style={{ width: 250, height: 250 }}
        />
      ) : (
        <ActivityIndicator />
      )}

      <Text className="mt-6 text-gray-500 text-center">
        Waiting for payment confirmation...
      </Text>
    </View>
  );
}
