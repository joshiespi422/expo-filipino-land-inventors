import { getPaymentMethods, payMembership } from "@/services/membershipService";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function MembershipCheckoutPage() {
  const { scheduleId, amount } = useLocalSearchParams();
  const router = useRouter();

  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const [navigating, setNavigating] = useState(false);
  const isProcessing = useRef(false);

  /**
   * Normalize params
   */
  const safeScheduleId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;
  const safeAmount = Array.isArray(amount) ? amount[0] : amount;

  /**
   * RESET STATE WHEN SCREEN IS FOCUSED
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      setCheckoutUrl(null);
      isProcessing.current = false;
    }, []),
  );

  /**
   * FORMAT
   */
  const formatAmount = (value: any) => {
    const num = Number(value || 0);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseAmount = (value: any) => {
    const cleaned = String(value || "")
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");

    const num = Number(cleaned);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
  };

  /**
   * LOAD PAYMENT METHODS
   */
  const loadMethods = async () => {
    try {
      const res = await getPaymentMethods();

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      const formatted = list.map((item: any) => ({
        id: item?.id,
        name: item?.attributes?.name,
        gateway_type: (item?.attributes?.gateway_type || "").toLowerCase(),
      }));

      const filtered = formatted.filter((m: any) =>
        ["qrph", "paymaya", "billease", "grab_pay"].includes(m.gateway_type),
      );

      setMethods(filtered);
      setSelectedMethod(filtered[0] || null);
    } catch (err) {
      console.log("❌ Failed to load methods", err);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  /**
   * HANDLE PAYMENT
   */
  const handleProceed = async () => {
    if (isProcessing.current || navigating || loading) return;

    if (!selectedMethod) {
      Alert.alert("Error", "Select payment method");
      return;
    }

    const parsedAmount = parseAmount(safeAmount);
    if (parsedAmount <= 0) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    if (!safeScheduleId) {
      Alert.alert("Error", "Missing schedule ID");
      return;
    }

    isProcessing.current = true;
    setLoading(true);
    setNavigating(true);

    try {
      const payload = {
        payment_method_id: selectedMethod.id,
        amount: parsedAmount,
        gateway: "paymongo",
      };

      console.log("🚀 PAYLOAD SENT:", payload);
      console.log("📌 scheduleId:", safeScheduleId);

      const result = await payMembership(String(safeScheduleId), payload);

      console.log(
        "🔥 FULL RESPONSE (MEMBERSHIP):",
        JSON.stringify(result, null, 2),
      );

      /**
       * ✅ FIX: correct response structure
       */
      const nextAction = result?.next_action;

      const url = nextAction?.redirect_url;
      const qr = nextAction?.qr_code_url;

      /**
       * optional safety (your backend has no paymentIntentId here)
       */
      const paymentIntentId =
        result?.data?.id || result?.payment_intent_id || null;

      if (url) {
        console.log("🌐 WEB FLOW TRIGGERED");
        setCheckoutUrl(url);
        return;
      }

      if (qr) {
        console.log("📱 QR FLOW TRIGGERED");

        router.push({
          pathname: "/profile/membership-qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: paymentIntentId ?? safeScheduleId,
          },
        });

        return;
      }

      throw new Error(result?.message || "No payment action returned");
    } catch (err: any) {
      console.log("🔥 ERROR OBJECT:", err);

      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create payment session";

      Alert.alert("Payment Failed", message);
    }
  };

  /**
   * WEBVIEW FLOW
   */
  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        onNavigationStateChange={(nav) => {
          console.log("🌐 WEBVIEW URL:", nav.url);

          if (nav.url.includes("payment/success")) {
            router.replace("/profile/membership-breakdown");
          }
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Membership Payment
          </Text>

          <Text className="text-primary text-3xl font-black mt-1">
            ₱{formatAmount(safeAmount)}
          </Text>
        </View>

        <Text className="font-semibold text-gray-800 mb-3 px-1">
          Select Payment Method
        </Text>

        {methods.map((m) => {
          const active = selectedMethod?.id === m.id;

          return (
            <TouchableOpacity
              key={m.id}
              disabled={navigating}
              onPress={() => setSelectedMethod(m)}
              className={`p-4 mb-3 rounded-xl border ${
                active
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Text className="font-semibold">{m.name}</Text>
              <Text className="text-xs text-gray-500 uppercase">
                {m.gateway_type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="absolute bottom-0 w-full p-5 bg-white border-t">
        <TouchableOpacity
          onPress={handleProceed}
          disabled={loading || navigating}
          className={`h-16 rounded-2xl justify-center items-center ${
            loading || navigating ? "bg-slate-300" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Pay ₱{formatAmount(safeAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
