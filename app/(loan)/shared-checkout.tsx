import { CustomAlert } from "@/components/CustomAlert";
import { getPaymentMethods, payShareCapital } from "@/services/loanService"; // Bound to loanService as provided

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

// Core definition for payment method models
interface PaymentMethod {
  id: string | number;
  name: string;
  gateway_type: string;
}

export default function SharedCheckoutPage() {
  const { scheduleId, amount } = useLocalSearchParams();
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

  // =========================
  // ALERT STATE
  // =========================
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    redirectHome: false,
    isConfirmation: false,
    onConfirm: () => {},
  });

  // RESET FLAGS ON PAGE FOCUS
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

      // Filter verified payment modes accepted by gateway integrations
      const filtered = formatted.filter((m) =>
        ["qrph", "paymaya", "billease", "grab_pay", "wallet"].includes(
          m.gateway_type,
        ),
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
  // PAYMENT PROCESS
  // =========================
  const executePaymentPayload = async () => {
    try {
      isProcessing.current = true;
      setLoading(true);

      const parsedAmount = parseAmount(safeAmount);

      // WALLET DETECTION
      const gateway =
        selectedMethod?.gateway_type === "wallet" ? "wallet" : "paymongo";

      // Payload strictly follows PayShareCapitalRequest validation rules
      const payload = {
        schedule_id: Number(safeScheduleId),
        payment_method_id: Number(selectedMethod!.id),
        amount: parsedAmount,
        gateway,
      };

      console.log("SHARE CAPITAL PAYLOAD:", payload);

      const response = await payShareCapital(payload);

      // Accessing next_action directly from root as defined in Laravel Controller return array
      const nextAction = response?.next_action;

      const qr =
        nextAction?.code?.image_url ||
        nextAction?.qr_code_url ||
        nextAction?.qr_url;

      const redirectUrl =
        nextAction?.redirect?.url ||
        nextAction?.redirect_url ||
        nextAction?.url;

      // Extract details needed for routing fallback if required
      const paymentIntentId = nextAction?.payment_intent_id || "";

      // =========================
      // WALLET SUCCESS FLOW
      // =========================
      if (gateway === "wallet") {
        setAlert({
          visible: true,
          title: "Payment Successful",
          message:
            "Share capital contribution settled successfully using wallet.",
          redirectHome: true,
          isConfirmation: false,
          onConfirm: () => {},
        });
        return;
      }

      // =========================
      // QR CODE FLOW
      // =========================
      if (qr) {
        setNavigating(true);

        router.push({
          pathname: "/shared-qrph",
          params: {
            qrUrl: String(qr),
            paymentIntentId: String(paymentIntentId),
            amount: String(parsedAmount),
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
        message: "No valid QR target or redirection window was generated.",
        redirectHome: false,
        isConfirmation: false,
        onConfirm: () => {},
      });
    } catch (error: any) {
      console.log("SHARE CAPITAL PAYMENT ERROR:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Payment processing failed";

      if (message.toLowerCase().includes("already paid")) {
        setAlert({
          visible: true,
          title: "Already Settled",
          message: "This share capital schedule item is already paid!",
          redirectHome: true,
          isConfirmation: false,
          onConfirm: () => {},
        });
      } else {
        setAlert({
          visible: true,
          title: "Transaction Error",
          message,
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
  // CONFIRM DIALOG TRIGGER
  // =========================
  const handleProceed = () => {
    if (isProcessing.current || loading || navigating) return;

    if (!selectedMethod) {
      setAlert({
        visible: true,
        title: "Selection Required",
        message: "Please select a preferred payment option to proceed.",
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
        setAlert((p) => ({ ...p, visible: false }));
        executePaymentPayload();
      },
    });
  };

  // =========================
  // CONDITIONAL RENDER: WEBVIEW
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
            Share Capital Payment
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
              onPress={() => setSelectedMethod(m)}
              disabled={loading || navigating}
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

      {/* Action Footer Button Bar */}
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

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        confirmText={alert.isConfirmation ? "Proceed" : "Okay"}
        onConfirm={alert.isConfirmation ? alert.onConfirm : undefined}
        onClose={() => {
          const shouldRedirect = alert.redirectHome;
          setAlert((p) => ({ ...p, visible: false }));

          if (shouldRedirect) {
            router.replace("/(main)");
          }
        }}
      />
    </View>
  );
}
