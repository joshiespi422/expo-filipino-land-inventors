import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

import { computeLoan, getLoan, payLoan } from "@/services/loanService";

export default function LoanPaymentPage() {
  const { id } = useLocalSearchParams();

  const [pageLoading, setPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [schedule, setSchedule] = useState<any[]>([]);
  const [loanData, setLoanData] = useState<any>(null);

  // 🔥 FETCH LOAN + COMPUTE SCHEDULE
  useEffect(() => {
    const fetchLoan = async () => {
      try {
        setPageLoading(true);

        const loan = await getLoan(id as string);

        const computed = await computeLoan({
          amount: Number(loan.attributes.amount),
          term: loan.attributes.term_months,
          start_date: loan.attributes.start_date,
        });

        const formatted = computed.schedule.map((item: any, index: number) => ({
          id: index + 1,
          month: item.month,
          totalPayment: Number(item.monthly_payment),
          interest: Number(item.interest),
          principal: Number(item.principal),
          penalties: 0,
          lateFees: 0,
          dueDate: item.due_date,
          status: "Unpaid",
        }));

        setSchedule(formatted);
        setLoanData(loan);
      } catch (error) {
        console.log("FETCH ERROR:", error);
      } finally {
        setPageLoading(false);
      }
    };

    if (id) fetchLoan();
  }, [id]);

  // ✅ AUTO SELECT FIRST UNPAID
  useEffect(() => {
    if (pageLoading || schedule.length === 0) return;

    const firstUnpaid = schedule.find((item) => item.status === "Unpaid");

    if (firstUnpaid) {
      setSelectedIds([firstUnpaid.id]);
    }
  }, [schedule, pageLoading]);

  // TOTAL
  const totalToPay = selectedIds.reduce((sum, id) => {
    const item = schedule.find((s) => s.id === id);
    return sum + (item?.totalPayment || 0);
  }, 0);

  // OUTSTANDING
  const outstandingBalance = schedule.reduce((sum, item) => {
    return item.status === "Unpaid" ? sum + item.totalPayment : sum;
  }, 0);

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // PAYMENT
  const handlePayment = async () => {
    try {
      setIsLoading(true);

      for (const schedId of selectedIds) {
        const item = schedule.find((s) => s.id === schedId);
        if (!item) continue;

        await payLoan(loanData.id, {
          amount: item.totalPayment,
          payment_date: new Date().toISOString(),
          schedule_id: schedId,
        });
      }

      alert("Payment successful!");

      // refresh
      const loan = await getLoan(id as string);

      const computed = await computeLoan({
        amount: Number(loan.attributes.amount),
        term: loan.attributes.term_months,
        start_date: loan.attributes.start_date,
      });

      const formatted = computed.schedule.map((item: any, index: number) => ({
        id: index + 1,
        month: item.month,
        totalPayment: Number(item.monthly_payment),
        interest: Number(item.interest),
        principal: Number(item.principal),
        penalties: 0,
        lateFees: 0,
        dueDate: item.due_date,
        status: "Unpaid",
      }));

      setSchedule(formatted);
      setSelectedIds([]);
    } catch (err) {
      console.log("PAY ERROR:", err);
      alert("Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 180 }}
      >
        {/* SUMMARY */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <View className="flex-row justify-between items-start">
            {pageLoading ? (
              <View className="gap-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-48" />
              </View>
            ) : (
              <View>
                <Text className="text-slate-400 text-xs font-bold uppercase">
                  Outstanding Balance
                </Text>
                <Text className="text-primary text-3xl font-black mt-1">
                  ₱{outstandingBalance.toFixed(2)}
                </Text>
              </View>
            )}

            <View className="bg-primary/10 p-2 rounded-full">
              <Ionicons name="wallet-outline" size={24} color="#034194" />
            </View>
          </View>
        </View>

        <Text className="text-slate-800 font-black text-lg mb-4 px-2">
          Repayment Plan
        </Text>

        {/* LIST */}
        <View>
          {pageLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  className="bg-white p-4 rounded-2xl mb-3 flex-row items-center"
                >
                  <Skeleton className="w-7 h-7 mr-4" />
                  <View className="flex-1 gap-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </View>
                </View>
              ))
            : schedule.map((item) => {
                const isPaid = item.status === "Paid";
                const isSelected = selectedIds.includes(item.id);
                const isExpanded = expandedId === item.id;

                return (
                  <View key={item.id} className="mb-3">
                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : item.id)}
                      className={`flex-row items-center p-4 rounded-2xl ${
                        isSelected ? "bg-primary" : "bg-white"
                      }`}
                    >
                      <TouchableOpacity
                        onPress={() => toggleSelection(item.id)}
                        className="mr-4"
                      >
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={22}
                          color={isSelected ? "white" : "#94a3b8"}
                        />
                      </TouchableOpacity>

                      <View className="flex-1">
                        <Text
                          className={`font-bold ${
                            isSelected ? "text-white" : "text-slate-800"
                          }`}
                        >
                          Installment {item.month}
                        </Text>
                        <Text
                          className={`text-xs ${
                            isSelected ? "text-white/70" : "text-slate-400"
                          }`}
                        >
                          {item.dueDate}
                        </Text>
                      </View>

                      <Text
                        className={`font-bold ${
                          isSelected ? "text-white" : "text-primary"
                        }`}
                      >
                        ₱{item.totalPayment.toFixed(2)}
                      </Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View className="bg-white p-4 rounded-b-2xl border">
                        <BreakdownRow
                          label="Principal"
                          value={item.principal}
                        />
                        <BreakdownRow label="Interest" value={item.interest} />
                      </View>
                    )}
                  </View>
                );
              })}
        </View>
      </ScrollView>

      {/* BUTTON */}
      <View className="px-6 pb-10 pt-4 bg-white absolute bottom-0 w-full border-t">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={isLoading || selectedIds.length === 0}
          className={`p-5 rounded-2xl ${
            isLoading || selectedIds.length === 0 ? "bg-gray-400" : "bg-primary"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">
              Pay ₱{totalToPay.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BreakdownRow({ label, value }: any) {
  return (
    <View className="flex-row justify-between mb-1">
      <Text className="text-slate-500 text-xs">{label}</Text>
      <Text className="text-slate-700 text-xs font-bold">
        ₱{Number(value).toFixed(2)}
      </Text>
    </View>
  );
}
