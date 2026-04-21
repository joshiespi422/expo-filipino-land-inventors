import {
  checkPaymentStatus,
  getPaymentMethods,
  payLoan,
} from "@/services/loanService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function LoanCheckoutPage() {
  const { id, scheduleId, amount } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // 💳 LOAD METHODS
  const loadMethods = async () => {
    try {
      const res = await getPaymentMethods();

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      if (!list.length) {
        setMethods([]);
        return;
      }

      const formatted = list.map((item: any) => ({
        id: item?.id,
        name: item?.attributes?.name,
        gateway_type: (item?.attributes?.gateway_type || "").toLowerCase(),
      }));

      const filtered = formatted.filter((m: any) =>
        ["card", "qrph", "paymaya", "billease", "grab_pay", "dob"].includes(
          m.gateway_type,
        ),
      );

      setMethods(filtered);
      setSelectedMethod(filtered[0] || null);
    } catch (err) {
      console.log("❌ Failed to load payment methods", err);
      setMethods([]);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // 💳 PAY
  const handleProceed = async () => {
    try {
      if (!selectedMethod) {
        Alert.alert("Select a payment method");
        return;
      }

      setLoading(true);

      const payload: any = {
        loan_schedule_id: Number(scheduleId),
        payment_method_id: selectedMethod.id,
        amount: parseFloat(amount as string),
        gateway: "paymongo",
      };

      if (selectedMethod.gateway_type === "card") {
        payload.gateway_payment_method_id = null;
      }

      const response = await payLoan(id as string, payload);
      const result = response?.data;

      const url = result?.data?.next_action?.redirect_url;
      const intentId = result?.data?.payment?.gateway_payment_intent_id;

      if (!url || !intentId) {
        Alert.alert(
          "Payment Error",
          result?.message || "Unable to create payment session",
        );
        return;
      }

      setPaymentIntentId(intentId);
      setCheckoutUrl(url);
      setIsPolling(true);
    } catch (error: any) {
      console.log("🔥 ERROR:", error?.response?.data);

      Alert.alert(
        "Payment Failed",
        error?.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔄 POLLING
  useEffect(() => {
    if (!isPolling || !paymentIntentId) return;

    pollingInterval.current = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(paymentIntentId);

        const status = res?.data?.status || res?.status;

        if (status === "paid" || status === "success") {
          clearInterval(pollingInterval.current!);
          router.replace("/payment-success");
        }
      } catch {}
    }, 3000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [isPolling, paymentIntentId]);

  // 🌐 WEBVIEW
  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        onNavigationStateChange={(nav) => {
          if (nav.url.includes("payment/success")) {
            router.replace("/payment-success");
          }
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* HEADER */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Checkout Payment
          </Text>
          <Text className="text-gray-500 mt-1">Loan #{id}</Text>

          <Text className="text-3xl font-bold text-primary mt-4">
            ₱{Number(amount).toFixed(2)}
          </Text>
        </View>

        {/* PAYMENT METHODS */}
        <Text className="font-semibold text-gray-800 mb-3">
          Select Payment Method
        </Text>

        {methods.length === 0 ? (
          <View className="p-4 bg-white rounded-xl border border-gray-200">
            <Text className="text-gray-500 text-center">
              No available payment methods
            </Text>
          </View>
        ) : (
          methods.map((m) => {
            const active = selectedMethod?.id === m.id;

            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSelectedMethod(m)}
                className={`p-4 mb-3 rounded-xl border ${
                  active
                    ? "border-primary bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text className="font-semibold text-gray-900">{m.name}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {m.gateway_type}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        {/* PAY BUTTON */}
        <TouchableOpacity
          onPress={handleProceed}
          disabled={loading}
          className="mt-6 p-4 bg-primary rounded-xl"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-base">
              Pay Now
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
