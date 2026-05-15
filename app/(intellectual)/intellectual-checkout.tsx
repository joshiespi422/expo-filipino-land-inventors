import {
  getPaymentMethods,
  payIntellectual,
  PaymentMethod,
} from "@/services/intellectualService";

import { CustomAlert } from "@/components/CustomAlert";

import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const [navigating, setNavigating] = useState(false);

  const isProcessing = useRef(false);

  // ALERT STATE
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const safeScheduleId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;

  const safeAmount = Array.isArray(amount) ? amount[0] : amount;

  const safeIntellectualId = Array.isArray(intellectualId)
    ? intellectualId[0]
    : intellectualId;

  // =========================
  // ALERT HELPER
  // =========================
  const showAlert = (title: string, message: string) => {
    setAlert({
      visible: true,
      title,
      message,
    });
  };

  // RESET LOCKS
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  // =========================
  // FORMAT AMOUNT
  // =========================
  const formatAmount = (value: any) => {
    const num = Number(String(value || "0").replace(/,/g, ""));

    return isNaN(num)
      ? "0.00"
      : num.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
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
        gateway_type: String(
          item?.attributes?.gateway_type || "",
        ).toLowerCase(),
      }));

      const filtered = formatted.filter((m) =>
        ["qrph", "paymaya", "billease", "grab_pay"].includes(m.gateway_type),
      );

      setMethods(filtered);
      setSelectedMethod(filtered[0] || null);
    } catch (err) {
      console.log("Failed to load payment methods", err);

      showAlert("Error", "Failed to load payment methods. Please try again.");
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // =========================
  // HANDLE PAYMENT
  // =========================
  const handleProceed = async () => {
    if (isProcessing.current || navigating || loading) return;

    if (!selectedMethod) {
      return showAlert("Error", "Please select a payment method");
    }

    isProcessing.current = true;

    setLoading(true);
    setNavigating(true);

    try {
      const payload = {
        payment_method_id: Number(selectedMethod.id),
      };

      const response = await payIntellectual(String(safeScheduleId), payload);

      const result = response?.data || response;

      console.log("FULL PAYMONGO RESPONSE:", JSON.stringify(result, null, 2));

      // =========================
      // FLEXIBLE EXTRACTION
      // =========================
      const payment = result?.payment;

      const gatewayResponse =
        payment?.gateway_response?.data || payment?.gateway_response;

      const gatewayAttributes = gatewayResponse?.attributes;

      const intentId =
        payment?.gateway_payment_intent_id || result?.gateway_payment_intent_id;

      const qr = gatewayAttributes?.next_action?.code?.image_url;

      const redirectUrl = gatewayAttributes?.next_action?.redirect?.url;

      const paymentAmount = payment?.amount;

      // =========================
      // VALIDATION
      // =========================
      if (!intentId && qr) {
        showAlert("Error", "Payment ID not found in response.");

        setNavigating(false);

        return;
      }

      setPaymentIntentId(String(intentId));

      // =========================
      // REDIRECT URL
      // =========================
      if (redirectUrl) {
        setCheckoutUrl(redirectUrl);
        return;
      }

      // =========================
      // QR FLOW
      // =========================
      if (qr) {
        router.push({
          pathname: "/intellectual-qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: String(intentId),
            intellectualId: String(safeIntellectualId),
            amount: String((paymentAmount || 0) / 100),
          },
        });

        return;
      }

      // =========================
      // NO QR / NO REDIRECT
      // =========================
      showAlert("Error", "Could not generate payment session.");

      setNavigating(false);
    } catch (error: any) {
      console.log("CHECKOUT ERROR:", error);

      const message =
        error?.response?.data?.message || error?.message || "Payment failed";

      showAlert("Error", message);

      setNavigating(false);
    } finally {
      setLoading(false);
      isProcessing.current = false;
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
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120,
        }}
      >
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Intellectual Property Payment
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
              onPress={() => !navigating && setSelectedMethod(m)}
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

      {/* FOOTER */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleProceed}
          disabled={loading || navigating}
          className={`h-16 rounded-2xl justify-center items-center ${
            loading || navigating ? "bg-gray-300" : "bg-primary"
          }`}
        >
          {loading || navigating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Pay ₱{formatAmount(safeAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CUSTOM ALERT */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() =>
          setAlert({
            ...alert,
            visible: false,
          })
        }
      />
    </View>
  );
}
