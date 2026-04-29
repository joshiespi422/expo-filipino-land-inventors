import {
  getPaymentMethods,
  payMembership,
  PaymentMethod,
} from "@/services/membershipService";
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

  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const [navigating, setNavigating] = useState(false);
  const isProcessing = useRef(false);

  const safeScheduleId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;
  const safeAmount = Array.isArray(amount) ? amount[0] : amount;

  // RESET LOCKS ON FOCUS (If user comes back from QR or WebView)
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  // =========================
  // FORMATTING & PARSING
  // =========================
  const formatAmount = (value: any) => {
    const num = Number(String(value).replace(/,/g, ""));
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseAmount = (value: any) => {
    const cleaned = String(value)
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
  };

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
      console.log("Failed to load payment methods", err);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleProceed = async () => {
    if (isProcessing.current || navigating || loading) return;

    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    const parsedAmount = parseAmount(safeAmount);
    isProcessing.current = true;
    setLoading(true);

    try {
      const payload = {
        membership_schedule_id: Number(safeScheduleId),
        payment_method_id: selectedMethod.id,
        amount: parsedAmount,
        gateway: "paymongo",
      };

      const response = await payMembership(String(safeScheduleId), payload);
      const result = response?.data;

      // 1. EXTRACT ACTIONS
      const nextAction = result?.next_action;
      const qr = nextAction?.qr_code_url;
      const url = nextAction?.redirect_url;

      // 2. FLEXIBLE ID EXTRACTION (The Fix)
      const intentId = result?.data?.payment?.gateway_payment_intent_id;

      // 3. VALIDATION
      if (!intentId && qr) {
        Alert.alert("Error", "Payment ID not found in response.");
        return;
      }

      // 4. ROUTING
      if (url) {
        setCheckoutUrl(url);
      }

      if (qr) {
        router.push({
          pathname: "/profile/membership-qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: String(intentId),
          },
        });
      }
    } catch (error: any) {
      setLoading(false);
      isProcessing.current = false;
      const message =
        error?.response?.data?.message || error.message || "Payment failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
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

      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-gray-100">
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
