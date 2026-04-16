import { Skeleton } from "@/components/ui/skeleton";
import { getLoan, payLoan } from "@/services/loanService";
import { Loan } from "@/types/loan.types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoanPaymentPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loanData, setLoanData] = useState<Loan | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (id) fetchLoanDetails();
  }, [id]);

  async function fetchLoanDetails() {
    try {
      setPageLoading(true);
      const response = await getLoan(id as string);
      setLoanData(response);

      const scheduleList = response.relationships?.loanSchedules?.data || [];
      const firstUnpaid = scheduleList.find(
        (i) => i.status.toLowerCase() !== "paid",
      );
      if (firstUnpaid) setSelectedIds([firstUnpaid.id]);
    } catch (e) {
      Alert.alert("Error", "Failed to load loan data");
    } finally {
      setPageLoading(false);
    }
  }

  const schedule = loanData?.relationships?.loanSchedules?.data || [];

  const totalToPay = selectedIds.reduce((sum, sId) => {
    const item = schedule.find((s) => s.id === sId);
    return sum + (Number(item?.total_payment) || 0);
  }, 0);

  const handlePayment = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      const targetId = selectedIds[0];
      const targetItem = schedule.find((s) => s.id === targetId);

      await payLoan(id as string, {
        loan_schedule_id: targetId,
        amount: Number(targetItem?.total_payment),
        payment_method_id: 1,
      });

      Alert.alert("Success", "Payment verified", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 150 }}
      >
        {/* Balance Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Remaining Balance
          </Text>
          {pageLoading ? (
            <Skeleton className="h-10 w-40 mt-2" />
          ) : (
            <Text className="text-primary text-3xl font-black mt-1">
              ₱
              {schedule
                .filter((i) => i.status.toLowerCase() !== "paid")
                .reduce((s, i) => s + Number(i.total_payment), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          )}
        </View>

        <Text className="text-slate-800 font-black text-lg mb-4 px-2">
          Repayment Plan
        </Text>

        {pageLoading ? (
          <ActivityIndicator className="mt-10" color="#034194" />
        ) : (
          schedule.map((item) => {
            const isPaid = item.status.toLowerCase() === "paid";
            const isSelected = selectedIds.includes(item.id);
            const isExpanded = expandedId === item.id;

            return (
              <View key={item.id} className="mb-3">
                <TouchableOpacity
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  className={`flex-row items-center p-4 rounded-t-2xl border-t border-x ${isPaid ? "bg-slate-50" : isSelected ? "bg-primary" : "bg-white"} ${!isExpanded ? "rounded-b-2xl border-b" : ""}`}
                >
                  <TouchableOpacity
                    onPress={() => !isPaid && setSelectedIds([item.id])}
                    className="mr-3"
                  >
                    <Ionicons
                      name={
                        isPaid
                          ? "checkmark-circle"
                          : isSelected
                            ? "radio-button-on"
                            : "radio-button-off"
                      }
                      size={24}
                      color={
                        isPaid ? "#22c55e" : isSelected ? "white" : "#cbd5e1"
                      }
                    />
                  </TouchableOpacity>

                  <View className="flex-1">
                    <Text
                      className={`font-bold ${isSelected ? "text-white" : "text-slate-800"}`}
                    >
                      Month {item.month_no}
                    </Text>
                    <Text
                      className={`text-[10px] ${isSelected ? "text-white/70" : "text-slate-400"}`}
                    >
                      {item.due_date}
                    </Text>
                  </View>

                  <View className="items-end mr-2">
                    <Text
                      className={`font-black ${isSelected ? "text-white" : "text-primary"}`}
                    >
                      ₱{Number(item.total_payment).toFixed(2)}
                    </Text>
                    <Text
                      className={`text-[9px] uppercase font-bold ${isPaid ? "text-green-500" : "text-orange-400"}`}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={isSelected ? "white" : "#cbd5e1"}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View className="p-4 bg-white border-x border-b rounded-b-2xl shadow-sm">
                    <BreakdownRow
                      label="Principal"
                      value={item.principal_amount}
                    />
                    <BreakdownRow
                      label="Interest"
                      value={item.interest_amount}
                    />
                    <BreakdownRow
                      label="Remaining"
                      value={item.ending_balance}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer Action */}
      <View className="absolute bottom-0 w-full bg-white p-6 border-t border-slate-100 shadow-2xl">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-slate-500 font-bold">Total to Pay</Text>
          <Text className="text-primary text-2xl font-black">
            ₱{totalToPay.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handlePayment}
          disabled={isLoading || selectedIds.length === 0}
          className={`p-4 rounded-2xl items-center ${isLoading || selectedIds.length === 0 ? "bg-slate-300" : "bg-primary"}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Confirm Payment
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between mb-1">
      <Text className="text-slate-500 text-xs">{label}</Text>
      <Text className="text-slate-800 text-xs font-bold">
        ₱{Number(value).toFixed(2)}
      </Text>
    </View>
  );
}
