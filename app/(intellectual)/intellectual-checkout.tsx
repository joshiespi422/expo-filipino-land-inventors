import { CustomAlert } from "@/components/CustomAlert";
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

  // =========================
  // CUSTOM ALERT STATE
  // =========================
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    redirectHome: false,
    isConfirmation: false,
    onConfirm: () => {},
  });

  // =========================
  // RESET LOCKS
  // =========================
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  // =========================
  // FORMATTERS
  // =========================
  const formatAmount = (value: any) => {
    const num = Number(String(value || "0").replace(/,/g, ""));

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

  // =========================
  // LOAD METHODS
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

      if (filtered.length > 0) {
        setSelectedMethod(filtered[0]);
      }
    } catch (err) {
      console.log("Failed to load payment methods", err);

      setAlert({
        visible: true,
        title: "Error",
        message: "Failed to load payment methods. Please try again.",
        redirectHome: false,
        isConfirmation: false,
        onConfirm: () => {},
      });
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // =========================
  // ACTUAL PAYMENT PROCESS
  // =========================
  const executePaymentPayload = async () => {
    try {
      isProcessing.current = true;
      setLoading(true);

      const parsedAmount = parseAmount(safeAmount);

      const payload = {
        payment_method_id: Number(selectedMethod!.id),
        amount: parsedAmount,
      };

      console.log("PAYLOAD:", payload);

      const response = await payIntellectual(String(safeScheduleId), payload);

      console.log("FULL PAYMENT RESPONSE:", JSON.stringify(response, null, 2));

      const result = response?.data || response;

      // =========================
      // FLEXIBLE EXTRACTION
      // =========================
      const payment = result?.payment || result?.data?.payment || result?.data;

      const gatewayResponse =
        payment?.gateway_response?.data || payment?.gateway_response;

      const gatewayAttributes = gatewayResponse?.attributes;

      const nextAction = gatewayAttributes?.next_action || result?.next_action;

      const qr =
        nextAction?.code?.image_url ||
        nextAction?.qr_code_url ||
        nextAction?.qr_url;

      const redirectUrl =
        nextAction?.redirect?.url ||
        nextAction?.redirect_url ||
        nextAction?.url;

      const paymentIntentId =
        payment?.gateway_payment_intent_id ||
        payment?.payment_intent_id ||
        payment?.id ||
        result?.gateway_payment_intent_id;

      const paymentAmount =
        payment?.amount || result?.amount || parsedAmount * 100;

      // =========================
      // QR FLOW
      // =========================
      if (qr) {
        setNavigating(true);

        router.push({
          pathname: "/intellectual-qrph",
          params: {
            qrUrl: String(qr),
            paymentIntentId: String(paymentIntentId || ""),
            intellectualId: String(safeIntellectualId),
            amount: String(Number(paymentAmount) / 100),
          },
        });

        return;
      }

      // =========================
      // WEBVIEW FLOW
      // =========================
      if (redirectUrl) {
        setCheckoutUrl(String(redirectUrl));
        return;
      }

      setAlert({
        visible: true,
        title: "Error",
        message: "No payment QR or checkout URL found.",
        redirectHome: false,
        isConfirmation: false,
        onConfirm: () => {},
      });
    } catch (error: any) {
      console.log("PAYMENT ERROR:", error);

      const message =
        error?.response?.data?.message || error?.message || "Payment failed";

      if (
        message.toLowerCase().includes("already paid") ||
        message.toLowerCase().includes("already paid")
      ) {
        setAlert({
          visible: true,
          title: "Already Settled",
          message:
            "This intellectual payment is already paid! Redirecting you home.",
          redirectHome: true,
          isConfirmation: false,
          onConfirm: () => {},
        });
      } else {
        setAlert({
          visible: true,
          title: "Transaction Error",
          message: message,
          redirectHome: true,
          isConfirmation: false,
          onConfirm: () => {},
        });
      }
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  // =========================
  // CONFIRMATION POPUP SYSTEM
  // =========================
  const handleProceed = () => {
    if (isProcessing.current || loading || navigating) return;

    if (!selectedMethod) {
      setAlert({
        visible: true,
        title: "Selection Required",
        message: "Please select a payment method to continue.",
        redirectHome: false,
        isConfirmation: false,
        onConfirm: () => {},
      });

      return;
    }

    setAlert({
      visible: true,
      title: "Confirm Payment",
      message: `Proceed with payment of ₱${formatAmount(
        safeAmount,
      )} using ${selectedMethod.name}?`,
      redirectHome: false,
      isConfirmation: true,
      onConfirm: () => {
        setAlert((prev) => ({
          ...prev,
          visible: false,
        }));

        executePaymentPayload();
      },
    });
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

  // =========================
  // UI
  // =========================
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120,
        }}
      >
        {/* CARD */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Intellectual Property Payment
          </Text>

          <Text className="text-primary text-3xl font-black mt-1">
            ₱{formatAmount(safeAmount)}
          </Text>
        </View>

        {/* METHODS */}
        <Text className="font-semibold text-gray-800 mb-3 px-1">
          Select Payment Method
        </Text>

        {methods.map((m) => {
          const active = selectedMethod?.id === m.id;

          return (
            <TouchableOpacity
              key={m.id}
              disabled={loading || navigating}
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

      {/* FOOTER */}
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

      {/* CUSTOM ALERT */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        confirmText={alert.isConfirmation ? "Proceed" : "Okay"}
        onConfirm={alert.isConfirmation ? alert.onConfirm : undefined}
        onClose={() => {
          const shouldRedirect = alert.redirectHome;

          setAlert((prev) => ({
            ...prev,
            visible: false,
          }));

          if (shouldRedirect) {
            router.replace("/(main)");
          }
        }}
      />
    </View>
  );
}
