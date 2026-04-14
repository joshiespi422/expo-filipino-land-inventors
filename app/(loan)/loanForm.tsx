import { Skeleton } from "@/components/ui/skeleton"; // Ensure this path is correct
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function LoanFormPage() {
  const router = useRouter();

  // States
  const [pageLoading, setPageLoading] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const isProcessing = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [navigating] = useState(false);

  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("6");

  const MAX_LIMIT = 16000;
  const MONTHLY_INTEREST_RATE = 0.03; // 3%

  // Effect: Initial Page Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (value: string) => {
    let rawValue = value.replace(/[^0-9]/g, "");
    if (rawValue && parseInt(rawValue) > MAX_LIMIT) {
      rawValue = MAX_LIMIT.toString();
    }
    const formattedValue = rawValue ? parseInt(rawValue).toLocaleString() : "";
    setAmount(formattedValue);
  };

  const generateSchedule = () => {
    const cleanAmount = amount.replace(/,/g, "");
    const P = parseFloat(cleanAmount) || 0;
    const n = parseInt(months);
    const r = MONTHLY_INTEREST_RATE;

    if (P <= 0) return [];

    const fixedPrincipal = P / n;
    let currentBalance = P;
    const schedule = [];
    const today = new Date();

    for (let i = 1; i <= n; i++) {
      const interestForMonth = currentBalance * r;
      const totalMonthlyPayment = fixedPrincipal + interestForMonth;
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        today.getDate(),
      );

      const dateString = dueDate.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      schedule.push({
        month: i,
        totalPayment: totalMonthlyPayment.toFixed(2),
        interest: interestForMonth.toFixed(2),
        principal: fixedPrincipal.toFixed(2),
        balance: Math.max(0, currentBalance - fixedPrincipal).toFixed(2),
        dueDate: dateString,
      });

      currentBalance -= fixedPrincipal;
    }
    return schedule;
  };

  const schedule = generateSchedule();

  const handleLoanCongrats = () => {
    if (isProcessing.current || isLoading || navigating) return;
    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/congratulations");
    }, 800);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-8">
          <View className="mx-5 pb-10 max-w-[500px] w-full self-center">
            {/* 1. HEADER */}
            <View className="pb-8 pt-5 px-4">
              {pageLoading ? (
                <View className="items-center gap-y-2">
                  <Skeleton className="h-8 w-60" />
                  <Skeleton className="h-4 w-72" />
                </View>
              ) : (
                <>
                  <Text className="text-center font-bold text-primary text-2xl">
                    Loan Computation
                  </Text>
                  <Text className="text-center text-slate-500 text-sm pt-2">
                    Review your diminishing interest monthly breakdown
                  </Text>
                </>
              )}
            </View>

            {/* 2. AMOUNT INPUT */}
            <View className="px-4">
              <View>
                <View className="flex-row items-center border-b-2 border-primary w-full py-2 justify-center">
                  <Text className="text-primary text-3xl font-bold mr-2">
                    ₱
                  </Text>
                  {pageLoading ? (
                    <Skeleton className="h-10 flex-1" />
                  ) : (
                    <TextInput
                      value={amount}
                      onChangeText={handleChange}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      className="text-primary text-3xl font-bold flex-1"
                    />
                  )}
                </View>
                {pageLoading ? (
                  <Skeleton className="h-3 w-32 mt-2" />
                ) : (
                  <Text className="p-1 text-slate-400">
                    Available ₱
                    {MAX_LIMIT.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                )}
              </View>

              {/* 3. REPAYMENT PERIOD PICKER */}
              <View className="w-full pt-6">
                <Text className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Repayment Period
                </Text>
                {pageLoading ? (
                  <Skeleton className="h-14 w-full rounded-xl" />
                ) : (
                  <View className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden h-14 justify-center">
                    <Picker
                      selectedValue={months}
                      onValueChange={(value) => setMonths(value)}
                      dropdownIconColor="#000"
                    >
                      {[...Array(12)].map((_, i) => (
                        <Picker.Item
                          key={i + 1}
                          label={`${i + 1} Month${i > 0 ? "s" : ""}`}
                          value={String(i + 1)}
                        />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              {/* 4. REPAYMENT TABLE */}
              <View className="mt-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <View className="bg-primary p-3">
                  <Text className="text-white font-bold text-center text-sm">
                    Monthly Repayment
                  </Text>
                </View>

                {/* Table Header */}
                <View className="flex-row bg-slate-100 py-3 border-b border-slate-200">
                  <Text className="w-[20%] text-[12px] font-bold text-slate-600 text-center">
                    Installment
                  </Text>
                  <Text className="flex-1 text-[12px] font-bold text-slate-600 text-center">
                    Repayment Amount
                  </Text>
                  <Text className="flex-1 text-[12px] font-bold text-slate-600 text-center">
                    Estimated Due Date
                  </Text>
                </View>

                {/* Table Body (Data or Skeleton) */}
                {pageLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <View
                      key={`table-skeleton-${i}`}
                      className="flex-row py-4 border-b border-slate-100 bg-white items-center"
                    >
                      <View className="w-[20%] items-center">
                        <Skeleton className="h-4 w-6" />
                      </View>
                      <View className="flex-1 items-center gap-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </View>
                      <View className="flex-1 items-center">
                        <Skeleton className="h-4 w-24" />
                      </View>
                    </View>
                  ))
                ) : schedule.length > 0 ? (
                  schedule.map((item) => (
                    <View
                      key={item.month}
                      className="flex-row py-4 border-b border-slate-100 bg-white items-center"
                    >
                      <Text className="w-[20%] text-[12px] text-slate-500 text-center font-bold">
                        {item.month}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-[12px] font-bold text-primary text-center">
                          ₱
                          {Number(item.totalPayment).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                        <Text className="text-[10px] text-slate-400 text-center">
                          Int: ₱
                          {Number(item.interest).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[12px] text-slate-600 text-center">
                          {item.dueDate}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="py-8 bg-white">
                    <Text className="text-center text-slate-400 italic text-xs">
                      Enter an amount to see the schedule
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 5. BOTTOM ACTION AREA */}
      <View className="px-6 pb-10 bg-white shadow-2xl max-w-[500px] w-full self-center">
        {pageLoading ? (
          <View className="py-5">
            <Skeleton className="h-6 w-full mb-5" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              className="flex-row py-5 items-center"
            >
              <View
                className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                  agreeToTerms
                    ? "bg-primary border-primary"
                    : "border-slate-300"
                }`}
              >
                {agreeToTerms && (
                  <View className="w-2 h-2 bg-white rounded-full" />
                )}
              </View>
              <Text className="text-xs text-slate-600 flex-1">
                I agree to the diminishing interest computation and terms.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLoanCongrats}
              disabled={!agreeToTerms || !amount}
              className={`h-16 rounded-2xl flex-row justify-center items-center ${
                !agreeToTerms || !amount ? "bg-slate-300" : "bg-primary"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Submit Loan
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
