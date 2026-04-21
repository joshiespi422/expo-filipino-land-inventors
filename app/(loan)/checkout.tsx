import { checkPaymentStatus, payLoan } from "@/services/loanService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function LoanCheckoutPage() {
  const { id, scheduleId, amount, methodId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const handleProceed = async () => {
    if (!scheduleId) {
      Alert.alert("Error", "Invalid schedule.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        loan_schedule_id: Number(scheduleId),
        payment_method_id: Number(methodId),
        amount: Math.round(Number(amount) * 100),
        gateway: "paymongo",
      };

      const response = await payLoan(id as string, payload);
      const result = response.data;

      const url =
        result?.data?.next_action?.checkout_url ||
        result?.next_action?.checkout_url;

      const intentId = result?.data?.payment?.gateway_payment_intent_id;

      if (!url || !intentId) {
        Alert.alert("Error", "Payment link not generated.");
        return;
      }

      setPaymentIntentId(intentId);
      setCheckoutUrl(url);
      setIsPolling(true);
    } catch (error: any) {
      Alert.alert("Payment Error", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /**
   * PAYMENT STATUS POLLING
   */
  useEffect(() => {
    if (!isPolling || !paymentIntentId) return;

    pollingInterval.current = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(paymentIntentId);

        if (["succeeded", "paid", "success"].includes(res.status)) {
          if (pollingInterval.current) clearInterval(pollingInterval.current);

          setCheckoutUrl(null);
          router.replace("/payment-success");
        }
      } catch (e) {
        console.log("Checking payment...");
      }
    }, 3000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [isPolling, paymentIntentId]);

  /**
   * IF WEBVIEW IS ACTIVE → SHOW PAYMENT SCREEN
   */
  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        style={{ flex: 1 }}
        onNavigationStateChange={(navState) => {
          console.log("NAV:", navState.url);
        }}
      />
    );
  }

  /**
   * NORMAL CHECKOUT UI
   */
  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center items-center">
        <View className="bg-primary/10 p-4 rounded-full mb-4">
          <Ionicons name="card-outline" size={40} color="#034194" />
        </View>

        <Text className="text-2xl font-black text-slate-800">
          Checkout Summary
        </Text>

        <Text className="text-slate-500 mt-2">Loan #{id}</Text>

        <View className="bg-slate-50 p-6 rounded-3xl mt-8 w-full">
          <Text className="text-slate-500 font-medium">Total Amount</Text>

          <Text className="text-2xl font-black text-primary mt-2">
            ₱{Number(amount).toFixed(2)}
          </Text>

          <View className="mt-4">
            <Text className="text-slate-600 text-sm">
              Schedule ID: #{scheduleId}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleProceed}
          disabled={loading}
          className={`mt-8 p-5 rounded-2xl w-full ${
            loading ? "bg-slate-300" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Pay Now
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
