import { Skeleton } from "@/components/ui/skeleton";
import {
  computeLoan,
  createLoan,
  getLoanableAmount,
} from "@/services/loanService";
import { ComputeLoanResponse } from "@/types/loan.types";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native"; // Added for back-button reset
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function LoanFormPage() {
  const router = useRouter();

  // PAGE & DATA STATES
  const [pageLoading, setPageLoading] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("6");
  const [maxLimit, setMaxLimit] = useState(0);
  const [computedData, setComputedData] = useState<ComputeLoanResponse | null>(
    null,
  );
  const [isComputing, setIsComputing] = useState(false);

  // NAVIGATION & SUBMIT LOCKS (The most important part)
  const [isLoading, setIsLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const isProcessing = useRef(false);

  // =========================
  // RESET LOCKS ON FOCUS
  // =========================
  useFocusEffect(
    useCallback(() => {
      setIsLoading(false);
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  // Initial Load: Fetch Max Loanable Amount
  useEffect(() => {
    const init = async () => {
      try {
        setPageLoading(true);
        const limit = await getLoanableAmount();
        setMaxLimit(parseFloat(limit));
      } catch (error) {
        console.error("Failed to fetch limit", error);
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, []);

  // Compute Schedule
  useEffect(() => {
    const cleanAmount = parseFloat(amount.replace(/,/g, ""));
    if (cleanAmount > 0) {
      const debounce = setTimeout(async () => {
        setIsComputing(true);
        try {
          const res = await computeLoan({
            amount: cleanAmount,
            term: parseInt(months),
          });
          setComputedData(res);
        } catch (error) {
          console.error("Computation failed", error);
        } finally {
          setIsComputing(false);
        }
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setComputedData(null);
    }
  }, [amount, months]);

  const handleChange = (value: string) => {
    let rawValue = value.replace(/[^0-9]/g, "");
    if (rawValue && parseInt(rawValue) > maxLimit) {
      rawValue = maxLimit.toString();
    }
    const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : "";
    setAmount(formattedValue);
  };

  // Validation Logic
  const hasInvalidScheduleAmount = computedData?.schedule?.some(
    (item) => parseFloat(item.monthly_payment) < 1,
  );

  const isAmountValid =
    parseFloat(amount.replace(/,/g, "")) >= 1 && !hasInvalidScheduleAmount;

  // =========================
  // HANDLE SUBMIT
  // =========================
  const handleLoanSubmit = async () => {
    // 1. Double-click prevention guard
    if (isProcessing.current || isLoading || navigating) return;

    const cleanAmount = parseFloat(amount.replace(/,/g, ""));

    if (!cleanAmount || cleanAmount < 1 || hasInvalidScheduleAmount) {
      Alert.alert(
        "Invalid Amount",
        "Monthly repayment must be at least ₱1.00.",
      );
      return;
    }

    if (!computedData) return;

    // 2. Set Locks
    isProcessing.current = true;
    setIsLoading(true);
    setNavigating(true);

    try {
      await createLoan({
        amount: cleanAmount,
        term: parseInt(months),
        start_date: new Date().toISOString().split("T")[0],
        agree_terms: true,
      });

      router.push({
        pathname: "/congratulations",
        params: { amount: cleanAmount },
      });
    } catch (error: any) {
      // 3. Reset locks ONLY if there is an error (so user can try again)
      setIsLoading(false);
      setNavigating(false);
      isProcessing.current = false;

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Something went wrong.",
      );
    }
  };

  if (pageLoading) {
    return (
      <View className="flex-1 bg-white p-5 pt-20">
        <Skeleton className="h-10 w-3/4 self-center mb-4" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center py-8">
          <View className="mx-5 pb-10 max-w-[500px] w-full self-center">
            <View className="pb-8 pt-5 px-4">
              <Text className="text-center font-bold text-primary text-2xl">
                Loan Computation
              </Text>
            </View>

            <View className="px-4">
              {/* INPUT AMOUNT */}
              <View className="flex-row items-center border-b-2 border-primary w-full py-2 justify-center">
                <Text className="text-primary text-3xl font-bold mr-2">₱</Text>
                <TextInput
                  value={amount}
                  onChangeText={handleChange}
                  keyboardType="numeric"
                  placeholder="0"
                  className="text-primary text-3xl font-bold flex-1"
                />
              </View>

              {/* REPAYMENT PERIOD */}
              <View className="w-full pt-6">
                <Text className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Repayment Period
                </Text>
                <View className="border border-slate-200 rounded-xl bg-slate-50 h-14 justify-center">
                  <Picker
                    selectedValue={months}
                    onValueChange={(v) => setMonths(v)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <Picker.Item
                        key={m}
                        label={`${m} Months`}
                        value={String(m)}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* SCHEDULE TABLE */}
              <View className="mt-8 border bg-white border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <View className="bg-primary p-3">
                  <Text className="text-white font-bold text-center text-sm">
                    Monthly Repayment
                  </Text>
                </View>

                <View className="flex-row bg-slate-100 py-3 border-b border-slate-200">
                  <Text className="w-[20%] text-[12px] font-bold text-center">
                    Month
                  </Text>
                  <Text className="flex-1 text-[12px] font-bold text-center">
                    Amount
                  </Text>
                  <Text className="flex-1 text-[12px] font-bold text-center">
                    Due Date
                  </Text>
                </View>

                {isComputing ? (
                  <View className="py-10">
                    <ActivityIndicator size="small" color="#034194" />
                  </View>
                ) : hasInvalidScheduleAmount ? (
                  <View className="py-8 bg-red-50 items-center">
                    <Text className="text-red-500 font-bold text-xs">
                      ₱0.00 Repayment not allowed
                    </Text>
                  </View>
                ) : computedData?.schedule ? (
                  computedData.schedule.map((item) => (
                    <View
                      key={item.month}
                      className="flex-row py-4 border-b border-slate-100 px-4 bg-white items-center"
                    >
                      <Text className="w-[20%] text-[12px] font-bold text-center">
                        {item.month}
                      </Text>
                      <Text className="flex-1 text-[12px] font-bold text-primary text-center">
                        ₱{parseFloat(item.monthly_payment).toLocaleString()}
                      </Text>
                      <Text className="flex-1 text-[12px] text-slate-600 text-center">
                        {item.due_date}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="py-8 text-center text-slate-400 italic text-xs">
                    Enter amount to see schedule
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTION */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={() => setAgreeToTerms(!agreeToTerms)}
          className="flex-row pb-5 items-center"
        >
          <View
            className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
              agreeToTerms
                ? "bg-primary border-primary"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            {agreeToTerms && (
              <View className="w-1.5 h-1.5 bg-white rounded-sm" />
            )}
          </View>
          <Text className="text-primary text-sm">
            I agree to the{" "}
            <Text className="underline font-bold">Terms and Conditions</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLoanSubmit}
          disabled={!agreeToTerms || !isAmountValid || isLoading || navigating}
          className={`h-16 rounded-2xl justify-center items-center ${
            !agreeToTerms || !isAmountValid || isLoading || navigating
              ? "bg-slate-300"
              : "bg-primary"
          }`}
        >
          {isLoading || navigating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Loan</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
