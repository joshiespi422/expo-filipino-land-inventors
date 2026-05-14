import {
  applyIntellectualPayment,
  getIntellectualProperty,
  getIntellectualSettings,
} from "@/services/intellectualService";

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function IntellectualPaymentPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);

  const [options, setOptions] = useState<any[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const isProcessing = useRef(false);

  const [hasSchedules, setHasSchedules] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const res = await getIntellectualProperty(id as string);

        if (!isMounted) return;

        const ip = res?.data;
        const attr = ip?.attributes || {};
        const relationships = ip?.relationships || {};

        const status = String(attr?.status || "").toLowerCase();

        const schedules = relationships?.schedules?.data || [];

        const alreadyHasSchedules = schedules.length > 0;

        setHasSchedules(alreadyHasSchedules);

        console.log("🔍 FULL IP:", JSON.stringify(ip, null, 2));
        console.log("STATUS:", status);
        console.log("SCHEDULES:", schedules.length);
        console.log("HAS SCHEDULES:", alreadyHasSchedules);

        /* FIXED */
        if (alreadyHasSchedules) {
          console.log("✅ REDIRECTING TO BREAKDOWN");

          router.replace({
            pathname: "/intellectual-breakdown",
            params: {
              id: String(id),
            },
          });

          return;
        }

        /* FIXED */
        if (status !== "waiting_for_payment") {
          Alert.alert(
            "Not Ready",
            "This intellectual property is not ready for payment.",
          );

          router.back();

          return;
        }

        const settings = await getIntellectualSettings(id as string);

        console.log("SETTINGS:", settings);

        if (!isMounted) return;

        const paymentOptions = settings?.payment_options || [];

        console.log("PAYMENT OPTIONS RAW:", paymentOptions);

        const totalAmount = Number(settings?.amount || attr?.amount || 0);

        if (!paymentOptions.length) {
          Alert.alert(
            "Not Ready",
            "No payment options configured for this property.",
          );

          router.back();

          return;
        }

        if (totalAmount <= 0) {
          Alert.alert("Not Ready", "Payment amount is not set properly.");

          router.back();

          return;
        }

        setAmount(totalAmount);
        setOptions(paymentOptions);
      } catch (e: any) {
        console.log("INIT ERROR:", e?.response?.data || e);

        Alert.alert(
          "Error",
          e?.response?.data?.message || "Failed to load payment options.",
        );
      } finally {
        setChecking(false);
        setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSubmit = async () => {
    if (!selectedOption || submitting || isProcessing.current) {
      return;
    }

    /* FIXED */
    if (hasSchedules) {
      router.replace({
        pathname: "/intellectual-breakdown",
        params: {
          id: String(id),
        },
      });

      return;
    }

    try {
      isProcessing.current = true;
      setSubmitting(true);

      console.log("SELECTED:", selectedOption);

      const payload = {
        term_months: Number(selectedOption.term_months),
      };

      console.log("PAYLOAD:", payload);

      const response = await applyIntellectualPayment(id as string, payload);

      console.log("SUCCESS:", response);

      /* FIXED */
      if (response?.conflict) {
        router.replace({
          pathname: "/intellectual-breakdown",
          params: {
            id: String(id),
          },
        });

        return;
      }

      Alert.alert("Success", "Schedule created.");

      router.replace({
        pathname: "/intellectual-breakdown",
        params: {
          id: String(id),
        },
      });
    } catch (e: any) {
      console.log("ERROR APPLY:", e?.response?.data || e);

      Alert.alert(
        "Cannot Proceed",
        e?.response?.data?.message || "Property not ready for payment.",
      );
    } finally {
      setSubmitting(false);
      isProcessing.current = false;
    }
  };

  if (checking || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-2 text-slate-500">Loading payment options...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-12">
      <ScrollView className="px-5">
        <Text className="text-2xl font-bold text-primary mb-3">
          Intellectual Property Payment
        </Text>

        <Text className="text-slate-500">Amount</Text>

        <Text className="text-3xl font-black text-primary mb-6">
          ₱
          {Number(amount).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelectedOption(opt)}
            disabled={hasSchedules}
            className={`p-4 mb-3 border rounded-2xl flex-row justify-between items-center ${
              selectedOption?.term_months === opt.term_months
                ? "border-primary bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <View>
              <Text className="font-bold">{opt.label}</Text>

              <Text className="text-sm text-gray-500">
                ₱
                {Number(opt.amount_per_term || 0).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                / month
              </Text>
            </View>

            <View
              className={`w-5 h-5 rounded-full border ${
                selectedOption?.term_months === opt.term_months
                  ? "border-4 border-primary"
                  : "border-gray-400"
              }`}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="p-5 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!selectedOption || submitting || hasSchedules}
          className={`h-14 rounded-xl justify-center items-center ${
            !selectedOption || submitting || hasSchedules
              ? "bg-gray-400"
              : "bg-primary"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold">
              {hasSchedules ? "Schedules Already Created" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
