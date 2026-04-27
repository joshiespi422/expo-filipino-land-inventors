import { getPaymentMethods } from "@/services/loanService";
import { payMembership } from "@/services/membershipService";
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

export default function MembershipCheckout() {
  const { scheduleId, amount } = useLocalSearchParams();
  const router = useRouter();

  // DATA STATES
  const [methods, setMethods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMethods, setFetchingMethods] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // NAVIGATION LOCKS
  const [navigating, setNavigating] = useState(false);
  const isProcessing = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setFetchingMethods(true);
        const res = await getPaymentMethods();

        const list = Array.isArray(res) ? res : res?.data || [];

        // Map and filter for PayMongo compatible methods
        const formatted = list.map((item: any) => ({
          id: item?.id,
          name: item?.attributes?.name || item?.name,
          gateway_type: (
            item?.attributes?.gateway_type ||
            item?.gateway_type ||
            ""
          ).toLowerCase(),
        }));

        const filtered = formatted.filter((m: any) =>
          ["qrph", "paymaya", "billease", "grab_pay", "gcash"].includes(
            m.gateway_type,
          ),
        );

        setMethods(filtered);
        if (filtered.length > 0) setSelected(filtered[0]);
      } catch (e) {
        console.error("Failed to fetch methods:", e);
      } finally {
        setFetchingMethods(false);
      }
    };
    fetchMethods();
  }, []);

  const handleProcessPayment = async () => {
    if (isProcessing.current || navigating || loading || !selected) return;

    isProcessing.current = true;
    setLoading(true);
    setNavigating(true);

    try {
      const res = await payMembership(scheduleId as string, {
        payment_method_id: selected.id,
      });

      // Handle response structure similar to Loan Checkout
      const result = res?.data?.data || res?.data || res;
      const nextAction = result?.next_action;
      const url = nextAction?.redirect_url;
      const qr = nextAction?.qr_code_url;
      const intentId = result?.payment?.gateway_payment_intent_id;

      // 📱 QR Flow
      if (qr && intentId) {
        router.push({
          pathname: "/qrph",
          params: {
            qrUrl: qr,
            paymentIntentId: intentId,
          },
        });
        return;
      }

      // 🌐 Redirect Web Flow
      if (url) {
        setCheckoutUrl(url);
        return;
      }

      Alert.alert("Success", "Payment initiated successfully.");
      router.replace("/profile/membership-breakdown");
    } catch (e: any) {
      isProcessing.current = false;
      setLoading(false);
      setNavigating(false);

      const msg = e.response?.data?.message || "Payment failed.";
      Alert.alert("Payment Error", msg);
    }
  };

  if (checkoutUrl) {
    return (
      <View className="flex-1">
        <WebView
          source={{ uri: checkoutUrl }}
          startInLoadingState
          onNavigationStateChange={(nav) => {
            if (nav.url.includes("success") || nav.url.includes("callback")) {
              router.replace("/profile/membership-breakdown");
            }
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="bg-white rounded-3xl p-6 mb-6 mt-10 shadow-sm">
          <Text className="text-slate-400 text-xs font-bold uppercase">
            Membership Payment
          </Text>
          <Text className="text-primary text-3xl font-black mt-1">
            ₱
            {Number(amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <Text className="font-semibold text-gray-800 mb-3 px-1">
          Select Payment Method
        </Text>

        {fetchingMethods ? (
          <ActivityIndicator size="large" color="#0000ff" className="mt-10" />
        ) : (
          methods.map((m) => {
            const active = selected?.id === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => !navigating && setSelected(m)}
                disabled={navigating}
                className={`p-5 mb-3 rounded-2xl border-2 flex-row items-center ${
                  active
                    ? "border-primary bg-blue-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-4 items-center justify-center ${active ? "border-primary" : "border-gray-300"}`}
                >
                  {active && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
                <View>
                  <Text
                    className={`font-bold text-base ${active ? "text-primary" : "text-slate-700"}`}
                  >
                    {m.name}
                  </Text>
                  <Text className="text-[10px] text-gray-400 uppercase font-bold">
                    {m.gateway_type}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-100">
        <TouchableOpacity
          onPress={handleProcessPayment}
          disabled={loading || navigating || !selected}
          className={`h-16 rounded-2xl justify-center items-center ${
            loading || navigating || !selected ? "bg-slate-300" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-black text-lg">Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
