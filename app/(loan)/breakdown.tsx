import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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

  const isLoanActive = loanData?.attributes?.status?.toLowerCase() === "active";

  // ✅ FIXED FORMAT FUNCTION
  const formatBackendSchedule = (loan: any) => {
    const schedules = loan?.relationships?.loanSchedules?.data ?? [];

    return schedules.map((item: any) => {
      const status =
        item?.status?.name || // ✅ main fix
        item?.status || // fallback if string
        "unpaid";

      return {
        id: item.id,
        month: item.month_no,
        totalPayment: Number(item.total_payment),
        interest: Number(item.interest_amount),
        principal: Number(item.principal_amount),
        penalties: 0,
        lateFees: 0,
        dueDate: item.due_date,
        status: status.toLowerCase(), // ✅ always string
      };
    });
  };

  // FETCH LOAN
  useEffect(() => {
    const fetchLoan = async () => {
      try {
        setPageLoading(true);

        const loan = await getLoan(id as string);

        let formatted = formatBackendSchedule(loan);

        // 🔁 fallback if backend empty
        if (formatted.length === 0) {
          const computed = await computeLoan({
            amount: Number(loan.attributes.amount),
            term: loan.attributes.term_months,
            start_date: loan.attributes.start_date,
          });

          formatted = computed.schedule.map((item: any, index: number) => ({
            id: index + 1,
            month: item.month,
            totalPayment: Number(item.monthly_payment),
            interest: Number(item.interest),
            principal: Number(item.principal),
            penalties: 0,
            lateFees: 0,
            dueDate: item.due_date,
            status: (item.status ?? "unpaid").toLowerCase(), // ✅ fixed
          }));
        }

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

  // AUTO SELECT FIRST UNPAID
  useEffect(() => {
    if (pageLoading || schedule.length === 0) return;
    if (!isLoanActive) return;

    const firstUnpaid = schedule.find((i) => i.status === "unpaid");

    if (firstUnpaid) setSelectedIds([firstUnpaid.id]);
  }, [schedule, pageLoading, isLoanActive]);

  // TOGGLE
  const toggleSelection = (id: number) => {
    if (!isLoanActive) return;

    const item = schedule.find((s) => s.id === id);
    if (!item || item.status !== "unpaid") return;

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const totalToPay = selectedIds.reduce((sum, id) => {
    const item = schedule.find((s) => s.id === id);
    return sum + (item?.totalPayment || 0);
  }, 0);

  // PAYMENT
  const handlePayment = async () => {
    if (!isLoanActive) return;

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
      const formatted = formatBackendSchedule(loan);

      setSchedule(formatted);
      setSelectedIds([]);
      setLoanData(loan);
    } catch (err) {
      console.log("PAY ERROR:", err);
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
                  ₱
                  {schedule
                    .filter((i) => i.status === "unpaid")
                    .reduce((a, b) => a + b.totalPayment, 0)
                    .toFixed(2)}
                </Text>

                {!isLoanActive && (
                  <Text className="text-red-500 text-xs font-bold mt-1">
                    VIEW ONLY MODE ({loanData?.attributes?.status})
                  </Text>
                )}
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

        <View>
          {pageLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  className="bg-white p-4 rounded-2xl mb-3 flex-row"
                >
                  <Skeleton className="w-7 h-7 mr-4" />
                  <View className="flex-1 gap-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </View>
                </View>
              ))
            : schedule.map((item) => {
                const isPaid = item.status === "paid";
                const isSelected = selectedIds.includes(item.id);
                const isExpanded = expandedId === item.id;
                const canInteract = isLoanActive && !isPaid;

                return (
                  <View key={item.id} className="mb-3">
                    <TouchableOpacity
                      activeOpacity={canInteract ? 0.9 : 1}
                      onPress={() => {
                        if (!isLoanActive) return;
                        setExpandedId(isExpanded ? null : item.id);
                      }}
                      className={`flex-row items-center p-4 rounded-t-2xl border-t border-x ${
                        isPaid
                          ? "bg-slate-200 border-slate-100 opacity-80"
                          : isSelected
                            ? "bg-primary border-primary"
                            : "bg-white border-white"
                      } ${
                        !isExpanded ? "rounded-b-2xl border-b shadow-sm" : ""
                      }`}
                    >
                      <TouchableOpacity
                        onPress={() => toggleSelection(item.id)}
                        disabled={!canInteract}
                        className="mr-4"
                      >
                        <Ionicons
                          name={
                            isPaid
                              ? "checkmark-circle"
                              : isSelected
                                ? "checkbox"
                                : "square-outline"
                          }
                          size={22}
                          color={
                            isPaid
                              ? "#22c55e"
                              : isSelected
                                ? "white"
                                : "#94a3b8"
                          }
                        />
                      </TouchableOpacity>

                      <View className="flex-1">
                        <Text
                          className={`font-bold ${
                            isSelected ? "text-white" : "text-slate-800"
                          }`}
                        >
                          Installment {item.month} || {item.status}
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

                      <Animated.View
                        style={{
                          transform: [
                            { rotate: isExpanded ? "180deg" : "0deg" },
                          ],
                        }}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={isSelected ? "white" : "#cbd5e1"}
                        />
                      </Animated.View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View className="p-4 rounded-b-2xl border-x border-b shadow-sm bg-white border-slate-100">
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

      <View className="px-6 pb-10 pt-4 bg-white absolute bottom-0 w-full border-t">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={isLoading || selectedIds.length === 0 || !isLoanActive}
          className={`p-5 rounded-2xl ${
            isLoading || selectedIds.length === 0 || !isLoanActive
              ? "bg-gray-400"
              : "bg-primary"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">
              {!isLoanActive ? "View Only" : `Pay ₱${totalToPay.toFixed(2)}`}
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
