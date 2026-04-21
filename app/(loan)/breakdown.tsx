import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import "../../global.css";

import { getLoan } from "@/services/loanService";

export default function LoanPaymentPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [pageLoading, setPageLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<any[]>([]);
  const [loanData, setLoanData] = useState<any>(null);

  const isLoanActive =
    (loanData?.attributes?.status || "").toLowerCase() === "active";

  /**
   * ✅ FIXED SCHEDULE MAPPER (JSON:API SAFE)
   */
  const formatBackendSchedule = (response: any) => {
    const loan = response?.data;
    const included = response?.included || [];

    const relationshipData = loan?.relationships?.loanSchedules?.data || [];

    if (!relationshipData.length) {
      console.log("No schedules found in relationships");
      return [];
    }

    return relationshipData.map((rel: any) => {
      const full = included.find(
        (inc: any) => inc.id === rel.id && inc.type === "api_loan_schedules",
      );

      const attr = full?.attributes || {};

      return {
        id: String(rel.id),

        month: Number(attr.month_no ?? 0),
        total_payment: Number(attr.total_payment ?? 0),
        interest: Number(attr.interest_amount ?? 0),
        principal: Number(attr.principal_amount ?? 0),

        dueDate: attr.due_date ?? "N/A",
        status: (attr.status ?? "unpaid").toLowerCase(),
      };
    });
  };

  /**
   * FETCH LOAN
   */
  useEffect(() => {
    const fetchLoan = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setPageLoading(true);

        const response = await getLoan(id, {
          include: "user,status,loanSchedules,loanPayments",
        });

        const loan = response?.data;

        if (!loan) {
          throw new Error("Loan missing in API response");
        }

        setLoanData(loan);

        const formattedSchedules = formatBackendSchedule(response);

        setSchedule(formattedSchedules);
      } catch (error) {
        console.error("FETCH ERROR:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  /**
   * AUTO SELECT FIRST UNPAID
   */
  useEffect(() => {
    if (pageLoading || schedule.length === 0) return;
    if (!isLoanActive) return;

    const firstUnpaid = schedule.find((i) => i.status === "unpaid");

    if (firstUnpaid) {
      setSelectedIds([firstUnpaid.id]);
    }
  }, [schedule, pageLoading, isLoanActive]);

  /**
   * TOGGLE SELECTION
   */
  const toggleSelection = (targetId: string) => {
    if (!isLoanActive) return;

    const index = schedule.findIndex((s) => s.id === targetId);
    const item = schedule[index];

    if (!item || item.status !== "unpaid") return;

    setSelectedIds((prev) => {
      const isSelected = prev.includes(targetId);

      if (isSelected) {
        return schedule
          .slice(0, index)
          .map((s) => s.id)
          .filter((id) => prev.includes(id));
      }

      return schedule
        .slice(0, index + 1)
        .filter((s) => s.status === "unpaid")
        .map((s) => s.id);
    });
  };

  /**
   * TOTAL AMOUNT
   */
  const totalToPay = selectedIds.reduce((sum, id) => {
    const item = schedule.find((s) => s.id === id);
    return sum + (item?.total_payment || 0);
  }, 0);

  /**
   * PAYMENT
   */
  const handlePayment = () => {
    if (selectedIds.length === 0 || !loanData?.id) return;

    router.push({
      pathname: "/checkout",
      params: {
        id: loanData.id,
        scheduleId: selectedIds[0],
        amount: totalToPay.toFixed(2),
        methodId: 1,
      },
    });
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 180 }}
      >
        {/* SUMMARY */}
        <View className="bg-white rounded-3xl p-6 mb-6">
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
                  .reduce((a, b) => a + (b.total_payment || 0), 0)
                  .toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        <Text className="font-black text-lg mb-4 px-2">Repayment Plan</Text>

        {/* SCHEDULE LIST */}
        {schedule.map((item) => {
          const isPaid = item.status === "paid";
          const isSelected = selectedIds.includes(item.id);
          const isExpanded = expandedId === item.id;

          return (
            <View key={item.id} className="mb-3">
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                className={`flex-row items-center p-4 rounded-2xl ${
                  isPaid
                    ? "bg-slate-100 opacity-60"
                    : isSelected
                      ? "bg-primary"
                      : "bg-white"
                }`}
              >
                <TouchableOpacity
                  onPress={() => toggleSelection(item.id)}
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
                      isPaid ? "#22c55e" : isSelected ? "white" : "#94a3b8"
                    }
                  />
                </TouchableOpacity>

                <View className="flex-1">
                  <Text
                    className={`font-bold ${isSelected ? "text-white" : ""}`}
                  >
                    Installment {item.month} | {item.status}
                  </Text>

                  <Text
                    className={`text-xs ${isSelected ? "text-white/70" : ""}`}
                  >
                    {item.dueDate}
                  </Text>
                </View>

                <Text
                  className={`font-bold ${
                    isSelected ? "text-white" : "text-primary"
                  }`}
                >
                  ₱{Number(item.total_payment || 0).toFixed(2)}
                </Text>
              </TouchableOpacity>

              {/* BREAKDOWN */}
              {isExpanded && (
                <View className="p-4 bg-white border rounded-b-2xl">
                  <BreakdownRow label="Principal" value={item.principal} />
                  <BreakdownRow label="Interest" value={item.interest} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ACTION */}
      <View className="absolute bottom-0 w-full p-5 bg-white border-t">
        <TouchableOpacity
          onPress={handlePayment}
          className="bg-primary p-5 rounded-2xl"
        >
          <Text className="text-white text-center font-bold">
            Pay ₱{totalToPay.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * BREAKDOWN ROW
 */
function BreakdownRow({ label, value }: any) {
  return (
    <View className="flex-row justify-between mb-1">
      <Text className="text-slate-500 text-xs">{label}</Text>
      <Text className="text-slate-700 text-xs font-bold">
        ₱{Number(value || 0).toFixed(2)}
      </Text>
    </View>
  );
}
