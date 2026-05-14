import {
  getPaymentMethods,
  payIntellectual,
  PaymentMethod,
} from "@/services/intellectualService";
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

export default function IntellectualCheckoutPage() {
  const { scheduleId, amount, mode, intellectualId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const isProcessing = useRef(false);

  const safeScheduleId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;
  const safeAmount = Array.isArray(amount) ? amount[0] : amount;
  const safeIntellectualId = Array.isArray(intellectualId)
    ? intellectualId[0]
    : intellectualId;

  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  const formatAmount = (value: any) => {
    const num = Number(String(value || "0").replace(/,/g, ""));
    return isNaN(num)
      ? "0.00"
      : num.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  };

  const loadMethods = async () => {
    try {
      const res = await getPaymentMethods();
      const list = res?.data || res || [];
      const formatted: PaymentMethod[] = list.map((item: any) => ({
        id: item?.id,
        name: item?.attributes?.name,
        gateway_type: String(
          item?.attributes?.gateway_type || "",
        ).toLowerCase(),
      }));

      const filtered = formatted.filter((m) =>
        ["qrph", "paymaya", "billease", "grab_pay", "card", "dob"].includes(
          m.gateway_type,
        ),
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

    isProcessing.current = true;
    setLoading(true);

    try {
      const payload = { payment_method_id: Number(selectedMethod.id) };
      const response = await payIntellectual(String(safeScheduleId), payload);
      const result = response?.data || response;

      console.log("FULL PAYMONGO RESPONSE:", JSON.stringify(result, null, 2));

      const payment = result?.payment;
      const gatewayResponse =
        payment?.gateway_response?.data || payment?.gateway_response;
      const gatewayAttributes = gatewayResponse?.attributes;

      const intentId = payment?.gateway_payment_intent_id;
      const qr = gatewayAttributes?.next_action?.code?.image_url;
      const redirectUrl = gatewayAttributes?.next_action?.redirect?.url;

      // PAYMONGO EXPIRY PATH CHECK
      // Sometimes it's in gatewayAttributes, sometimes inside the payment object itself
      const expiryTimestamp =
        gatewayAttributes?.expires_at || payment?.expires_at;
      const paymentAmount = payment?.amount;

      if (redirectUrl) {
        setCheckoutUrl(redirectUrl);
        return;
      }

      if (qr) {
        router.push({
          pathname: "/intellectual-qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: String(intentId),
            intellectualId: String(safeIntellectualId),
            amount: String(paymentAmount / 100),
            expiresAt: String(expiryTimestamp || ""), // Pass empty string if null to avoid NaN
          },
        });
      } else {
        Alert.alert("Error", "Could not generate QR code.");
      }
    } catch (error: any) {
      console.log("CHECKOUT ERROR:", error);
      Alert.alert("Error", "Payment failed");
    } finally {
      setLoading(false);
      isProcessing.current = false;
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
        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Intellectual Property Payment
          </Text>
          <Text className="text-primary text-3xl font-black mt-1">
            ₱{formatAmount(safeAmount)}
          </Text>
        </View>

        <Text className="font-semibold mb-3 px-1">Select Payment Method</Text>

        {methods.map((m) => {
          const active = selectedMethod?.id === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => setSelectedMethod(m)}
              className={`p-4 mb-3 rounded-xl border ${active ? "border-primary bg-blue-50" : "border-gray-200 bg-white"}`}
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
          className={`h-16 rounded-2xl justify-center items-center ${loading || navigating ? "bg-gray-300" : "bg-primary"}`}
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
