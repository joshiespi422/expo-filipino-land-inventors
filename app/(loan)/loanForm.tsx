import {
  computeLoan,
  createLoan,
  getLoanableAmount,
} from "@/services/loanService"; // Ensure these paths are correct
import { ComputeLoanResponse } from "@/types/loan.types";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

  // States
  const [pageLoading, setPageLoading] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("6");
  const [maxLimit, setMaxLimit] = useState(0);
  const [computedData, setComputedData] = useState<ComputeLoanResponse | null>(
    null,
  );
  const [isComputing, setIsComputing] = useState(false);

  // 1. Initial Load: Fetch Max Loanable Amount
  useEffect(() => {
    const init = async () => {
      try {
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

  // 2. Compute Schedule: Trigger when amount or months change
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
      }, 500); // Debounce to avoid excessive API calls
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

  // 3. Handle Submission: Create the Loan
  const handleLoanSubmit = async () => {
    if (isLoading || !computedData) return;

    setIsLoading(true);
    try {
      // Clean the amount (remove commas)
      const cleanAmount = parseFloat(amount.replace(/,/g, ""));

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
      // Detailed error logging for debugging validation issues
      console.log("Validation Errors:", error?.response?.data?.errors);

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center py-8">
          <View className="mx-5 pb-10 max-w-[500px] w-full self-center">
            {/* HEADER */}
            <View className="pb-8 pt-5 px-4">
              <Text className="text-center font-bold text-primary text-2xl">
                Loan Computation
              </Text>
              <Text className="text-center text-slate-500 text-sm pt-2">
                Review your diminishing interest monthly breakdown
              </Text>
            </View>

            {/* AMOUNT INPUT */}
            <View className="px-4">
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
              <Text className="p-1 text-slate-400">
                Available ₱
                {maxLimit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>

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
                    {[3, 6, 12, 24].map((m) => (
                      <Picker.Item
                        key={m}
                        label={`${m} Months`}
                        value={String(m)}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* REPAYMENT TABLE */}
              <View className="mt-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <View className="bg-primary p-3">
                  <Text className="text-white font-bold text-center text-sm">
                    Monthly Repayment
                  </Text>
                </View>

                {/* Table Header */}
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
                  <ActivityIndicator
                    size="small"
                    color="#000"
                    className="py-10"
                  />
                ) : computedData?.schedule ? (
                  computedData.schedule.map((item) => (
                    <View
                      key={item.month}
                      className="flex-row py-4 border-b border-slate-100 bg-white items-center"
                    >
                      <Text className="w-[20%] text-[12px] text-center font-bold">
                        {item.month}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-[12px] font-bold text-primary text-center">
                          ₱{parseFloat(item.monthly_payment).toLocaleString()}
                        </Text>
                        <Text className="text-[10px] text-slate-400 text-center">
                          Int: ₱{item.interest}
                        </Text>
                      </View>
                      <Text className="flex-1 text-[12px] text-slate-600 text-center">
                        {item.due_date}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="py-8 bg-white text-center text-slate-400 italic text-xs">
                    Enter amount to see schedule
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION */}
      <View className="px-6 pb-10 bg-white shadow-2xl w-full self-center">
        <TouchableOpacity
          onPress={() => setAgreeToTerms(!agreeToTerms)}
          className="flex-row py-5 items-center"
        >
          <View
            className={`w-5 h-5 rounded border mr-3 ${agreeToTerms ? "bg-primary" : "border-slate-300"}`}
          />
          <Text className="text-xs text-slate-600 flex-1">
            I agree to the diminishing interest terms.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLoanSubmit}
          disabled={!agreeToTerms || !amount || isLoading}
          className={`h-16 rounded-2xl justify-center items-center ${!agreeToTerms || !amount ? "bg-slate-300" : "bg-primary"}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit Loan</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
