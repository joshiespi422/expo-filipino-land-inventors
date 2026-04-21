import { getPaymentMethods, payLoan } from "@/services/loanService";
import { PaymentMethod } from "@/types/loan.types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // =========================
  // FORMAT AMOUNT
  // =========================
  const formatAmount = (value: any) => {
    const num = Number(String(value).replace(/,/g, ""));
    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================
  // SAFE PARSE
  // =========================
  const parseAmount = (value: any) => {
    const cleaned = String(value)
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");

    const num = Number(cleaned);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
  };

  // =========================
  // LOAD PAYMENT METHODS
  // =========================
  const loadMethods = async () => {
    try {
      const res = await getPaymentMethods();

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      const formatted: PaymentMethod[] = list.map((item: any) => ({
        id: item?.id,
        name: item?.attributes?.name,
        gateway_type: (item?.attributes?.gateway_type || "").toLowerCase(),
      }));

      const filtered = formatted.filter((m) =>
        ["qrph", "paymaya", "billease", "grab_pay"].includes(m.gateway_type),
      );

      setMethods(filtered);
      setSelectedMethod(filtered[0] || null);
    } catch (err) {
      console.log("❌ Failed to load payment methods", err);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // =========================
  // PAY LOAN
  // =========================
  const handleProceed = async () => {
    if (isSubmitting) return; // ⛔ prevent double click

    try {
      if (!selectedMethod) {
        Alert.alert("Select a payment method");
        return;
      }

      const parsedAmount = parseAmount(amount);

      if (parsedAmount <= 0) {
        Alert.alert("Invalid amount");
        return;
      }

      setIsSubmitting(true);
      setLoading(true);

      const payload = {
        loan_schedule_id: Number(scheduleId),
        payment_method_id: selectedMethod.id,
        amount: parsedAmount,
        gateway: "paymongo",
      };

      const response = await payLoan(id as string, payload);
      const result = response?.data;

      const nextAction = result?.data?.next_action;
      const url = nextAction?.redirect_url;
      const qr = nextAction?.qr_code_url;
      const intentId = result?.data?.payment?.gateway_payment_intent_id;

      if (!intentId) {
        Alert.alert(
          "Payment Error",
          result?.message || "Unable to create payment session",
        );
        return;
      }

      setPaymentIntentId(intentId);

      // 🌐 Redirect Web
      if (url) {
        setCheckoutUrl(url);
        return;
      }

      // 📱 QR Flow
      if (qr) {
        router.push({
          pathname: "/qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: intentId,
          },
        });
        return;
      }

      Alert.alert("Payment Error", "No available payment action");
    } catch (error: any) {
      console.log("🔥 ERROR:", error?.response?.data);

      const message =
        error?.response?.data?.message || "Failed to create payment session";

      // =========================
      // ⚠️ HANDLE YOUR BACKEND ERROR
      // =========================
      if (message.includes("pending")) {
        Alert.alert(
          "Payment Pending",
          "You already have a recent pending payment for this schedule. Please wait a moment before trying again.",
        );
      } else {
        Alert.alert("Payment Failed", message);
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // =========================
  // WEBVIEW
  // =========================
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
        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Checkout Payment
          </Text>
          {/* <Text className="text-gray-500 mt-1">Loan #{id}</Text> */}

          <Text className="text-primary text-3xl font-black mt-1">
            ₱{formatAmount(amount)}
          </Text>
        </View>

        <Text className="font-semibold text-gray-800 mb-3">
          Select Payment Method
        </Text>

        {methods.map((m) => {
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
        })}
      </ScrollView>

      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleProceed}
          disabled={loading}
          className="bg-primary p-5 rounded-2xl"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-base">
              Pay Now
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
