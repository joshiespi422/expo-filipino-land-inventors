import { CustomAlert } from "@/components/CustomAlert";
import {
  getPaymentMethods,
  PaymentMethod,
  rechargeWallet,
} from "@/services/walletService";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function CheckoutPage() {
  const { amount, type } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const isProcessing = useRef(false);

  const safeAmount = Array.isArray(amount) ? amount[0] : amount;
  const isWalletLoad = type === "wallet_load";

  // CUSTOM ALERT STATE
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    redirectHome: false,
    isConfirmation: false,
    onConfirm: () => {},
  });

  // RESET LOCKS WHEN SCREEN COMES INTO FOCUS
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
    const num = Number(String(value).replace(/,/g, ""));
    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseAmountInCents = (value: any) => {
    const cleaned = String(value)
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");
    const num = Number(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100);
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
        gateway_type: (item?.attributes?.gateway_type || "").toLowerCase(),
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
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  // =========================
  // TRANSACTION PAYLOAD LOGIC
  // =========================
  const executePaymentPayload = async () => {
    try {
      isProcessing.current = true;
      setLoading(true);

      const amountInCents = parseAmountInCents(safeAmount);

      if (isWalletLoad) {
        // WALLET RECHARGE INTEGRATION
        const payload = {
          amount: amountInCents,
          payment_method_id: Number(selectedMethod!.id),
          gateway_payment_method_id: null,
        };

        console.log("SENDING WALLET RECHARGE PAYLOAD:", payload);
        const response = await rechargeWallet(payload);
        console.log("RECHARGE RESPONSE:", JSON.stringify(response, null, 2));

        // FIXED: Extract data layers using the same robust extraction strategy as membership
        const result = response?.data || response;

        // Treat them as 'any' so TypeScript stops checking their keys
        const resAny = response as any;
        const resultAny = result as any;

        const nextAction =
          resAny?.next_action ||
          resultAny?.next_action ||
          resAny?.data?.next_action;

        const qr = nextAction?.qr_code_url || nextAction?.qr_url;
        const url = nextAction?.redirect_url || nextAction?.url;

        // QR FLOW
        if (qr) {
          setNavigating(true);
          router.push({
            pathname: "/profile/membership-qrph",
            params: {
              qrUrl: String(qr),
              paymentIntentId: String(result?.id || response?.data?.id || ""),
              amount: String(amountInCents / 100),
            },
          });
          return;
        }

        // WEBVIEW FLOW
        if (url) {
          setCheckoutUrl(String(url));
          return;
        }
      } else {
        throw new Error(
          "Invalid request process channel target configuration context.",
        );
      }

      setAlert({
        visible: true,
        title: "Error",
        message:
          "No usable payment transaction context route action URLs could be derived.",
        redirectHome: false,
        isConfirmation: false,
        onConfirm: () => {},
      });
    } catch (error: any) {
      console.log("PAYMENT SUBMISSION TRANSACTION FAILED ERROR:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Recharge pipeline execution failure.";

      setAlert({
        visible: true,
        title: "Transaction Error",
        message: message,
        redirectHome: true, // Triggers redirect back home safely
        isConfirmation: false,
        onConfirm: () => {},
      });
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  // =========================
  // CONFIRMATION DIALOG INTERCEPT
  // =========================
  const handleProceed = () => {
    if (isProcessing.current || loading || navigating) return;

    if (!selectedMethod) {
      setAlert({
        visible: true,
        title: "Selection Required",
        message: "Please choose an active gateway route option method below.",
        redirectHome: false,
        isConfirmation: false,
        onConfirm: () => {},
      });
      return;
    }

    setAlert({
      visible: true,
      title: "Confirm Wallet Load",
      message: `Proceed with loading ₱${formatAmount(safeAmount)} into your wallet using ${selectedMethod.name}?`,
      redirectHome: false,
      isConfirmation: true,
      onConfirm: () => {
        setAlert((prev) => ({ ...prev, visible: false }));
        executePaymentPayload();
      },
    });
  };

  // =========================
  // EMBEDDED WEBVIEW ENGINE RENDERING
  // =========================
  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        style={{ flex: 1 }}
        startInLoadingState
        onNavigationStateChange={(nav) => {
          if (nav.url.includes("payment/success")) {
            // FIXED: Avoid routing straight to layout group directories like /(main)
            router.replace("/payment-success");
          }
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* WALLET BRANDED METRIC CARD */}
        <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Wallet Funds Recharge
          </Text>
          <Text className="text-primary text-3xl font-black mt-1">
            ₱{formatAmount(safeAmount)}
          </Text>
        </View>

        {/* PAYMENT ROUTING SELECTION COMPONENT GRID */}
        <Text className="font-semibold text-gray-800 mb-3 px-1">
          Select Gateway Method
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
                  ? "border-primary bg-blue/60"
                  : "border-gray-200 bg-white"
              }`}
            >
              <Text
                className={`font-semibold ${active ? "text-primary" : "text-slate-800"}`}
              >
                {m.name}
              </Text>
              <Text className="text-xs text-gray-400 uppercase mt-0.5">
                {m.gateway_type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FOOTER CALL-TO-ACTION PANEL */}
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
              Confirm & Pay ₱{formatAmount(safeAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* SYSTEM FEEDBACK NOTIFICATIONS POPUP ALERT */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        confirmText={alert.isConfirmation ? "Proceed" : "Okay"}
        onConfirm={alert.isConfirmation ? alert.onConfirm : undefined}
        onClose={() => {
          const shouldRedirect = alert.redirectHome;
          setAlert((prev) => ({ ...prev, visible: false }));
          if (shouldRedirect) {
            // FIXED: Replaces folder layout string with explicitly clean base indexing path target alias
            router.replace("/");
          }
        }}
      />
    </View>
  );
}
