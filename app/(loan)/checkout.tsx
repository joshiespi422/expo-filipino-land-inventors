import { getPaymentMethods, payLoan } from "@/services/loanService";
import { PaymentMethod } from "@/types/loan.types";
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

// COMPONENTS
import { CustomAlert } from "@/components/CustomAlert";

export default function LoanCheckoutPage() {
  const { id, scheduleId, amount } = useLocalSearchParams();
  const router = useRouter();

  // DATA STATES
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // ALERT STATE
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  // ==========================================
  // 🛡️ NAVIGATION LOCKS (STRICT PREVENT CLICK)
  // ==========================================
  const [navigating, setNavigating] = useState(false);
  const isProcessing = useRef(false);

  // RESET LOCKS ON FOCUS
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

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

      showAlert("Error", "Failed to load payment methods. Please try again.");
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // =========================
  // 💰 PAY LOAN (HANDLE PROCEED)
  // =========================
  const handleProceed = async () => {
    // HARD STOP
    if (isProcessing.current || navigating || loading) return;

    if (!selectedMethod) {
      return showAlert("Error", "Please select a payment method");
    }

    const parsedAmount = parseAmount(amount);

    if (parsedAmount <= 0) {
      return showAlert("Error", "Invalid payment amount");
    }

    // SET LOCKS
    isProcessing.current = true;
    setLoading(true);
    setNavigating(true);

    try {
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
        throw new Error(result?.message || "Unable to create payment session");
      }

      setPaymentIntentId(intentId);

      // WEB CHECKOUT
      if (url) {
        setCheckoutUrl(url);
        return;
      }

      // QR FLOW
      if (qr) {
        router.push({
          pathname: "/qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: intentId,
            amount: String(parsedAmount),
          },
        });

        return;
      }

      throw new Error("No available payment action");
    } catch (error: any) {
      console.log("PAYMENT ERROR:", error);

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
  // WEBVIEW RENDER
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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="bg-white rounded-3xl p-6 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Checkout Payment
          </Text>

          <Text className="text-primary text-3xl font-black mt-1">
            ₱{formatAmount(amount)}
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
              onPress={() => !navigating && setSelectedMethod(m)}
              disabled={navigating}
              className={`p-4 mb-3 rounded-xl border ${
                active
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Text className="font-semibold text-gray-900">{m.name}</Text>

              <Text className="text-xs text-gray-500 mt-1 uppercase">
                {m.gateway_type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FOOTER ACTION */}
      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleProceed}
          disabled={loading || navigating}
          className={`h-16 rounded-2xl justify-center items-center ${
            loading || navigating ? "bg-slate-300" : "bg-primary"
          }`}
        >
          {loading || navigating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Pay Now
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
