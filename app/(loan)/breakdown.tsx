import { Skeleton } from "@/components/ui/skeleton";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import "../../global.css";

import { getLoan } from "@/services/loanService";

export default function LoanPaymentPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [pageLoading, setPageLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<any[]>([]);
  const [loanData, setLoanData] = useState<any>(null);

  const isLoanActive =
    (loanData?.attributes?.status || "").toLowerCase() === "active";

  /**
   * 💰 FORMAT MONEY
   */
  const formatMoney = (value: any) => {
    const num = Number(value || 0);
    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * 📅 FORMAT DATE → April 2, 2026
   */
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * 📦 MAP BACKEND
   */
  const formatBackendSchedule = (response: any) => {
    const loan = response?.data;
    const included = response?.included || [];
    const relationshipData = loan?.relationships?.loanSchedules?.data || [];

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

        setLoanData(response?.data);
        setSchedule(formatBackendSchedule(response));
      } catch (error) {
        console.error("FETCH ERROR:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  /**
   * NEXT UNPAID (HIGHLIGHT TARGET)
   */
  const nextToPayIndex = schedule.findIndex((i) => i.status === "unpaid");

  const nextToPayId =
    nextToPayIndex !== -1 ? schedule[nextToPayIndex]?.id : null;

  /**
   * OUTSTANDING
   */
  const outstanding = schedule
    .filter((i) => i.status === "unpaid")
    .reduce((a, b) => a + (b.total_payment || 0), 0);

  /**
   * AUTO PAYMENT
   */
  const handlePayment = () => {
    const firstUnpaid = schedule.find((i) => i.status === "unpaid");

    if (!firstUnpaid || !loanData?.id) return;

    router.push({
      pathname: "/checkout",
      params: {
        id: loanData.id,
        scheduleId: firstUnpaid.id,
        amount: firstUnpaid.total_payment.toFixed(2),
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
            <Skeleton className="h-10 w-48" />
          ) : (
            <>
              <Text className="text-slate-400 text-xs font-bold uppercase">
                Outstanding Balance
              </Text>

              <Text className="text-primary text-3xl font-black mt-1">
                ₱{formatMoney(outstanding)}
              </Text>
            </>
          )}
        </View>

        <Text className="font-black text-lg mb-4 px-2">Repayment Plan</Text>

        {/* LIST */}
        {schedule.map((item, index) => {
          const isPaid = item.status === "paid";
          const isExpanded = expandedId === item.id;
          const isNext = item.id === nextToPayId;

          return (
            <View key={item.id} className="mb-4">
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                activeOpacity={0.85}
                className={`rounded-2xl p-4 border overflow-hidden ${
                  isPaid
                    ? "bg-slate-100 border-slate-200 opacity-70"
                    : isNext
                      ? "bg-gradient-to-r from-yellow-50 to-white border-yellow-300"
                      : "bg-white border-slate-100"
                }`}
              >
                {/* HEADER ROW */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    {/* STATUS BADGE */}
                    {isPaid ? (
                      <View className="bg-green-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-green-600 text-[10px] font-bold">
                          PAID
                        </Text>
                      </View>
                    ) : isNext ? (
                      <View className="bg-yellow-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-yellow-600 text-[10px] font-bold">
                          NEXT
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-slate-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-slate-500 text-[10px] font-bold">
                          PENDING
                        </Text>
                      </View>
                    )}

                    <View className="flex-1">
                      <Text className="font-bold text-slate-800">
                        Installment {item.month}
                      </Text>

                      <Text className="text-xs text-slate-500 mt-0.5">
                        Due {formatDate(item.dueDate)}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-black text-primary text-base">
                    ₱{formatMoney(item.total_payment)}
                  </Text>
                </View>

                {/* PROGRESS INDICATOR BAR */}
                <View className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full ${
                      isPaid
                        ? "bg-green-500 w-full"
                        : isNext
                          ? "bg-yellow-400 w-2/3"
                          : "bg-slate-300 w-1/3"
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* BREAKDOWN */}
              {isExpanded && (
                <View className="bg-white border border-slate-100 rounded-2xl mt-2 p-4 shadow-sm">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 text-xs">Principal</Text>
                    <Text className="text-slate-700 text-xs font-bold">
                      ₱{formatMoney(item.principal)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-xs">Interest</Text>
                    <Text className="text-slate-700 text-xs font-bold">
                      ₱{formatMoney(item.interest)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ACTION */}
      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handlePayment}
          className="bg-primary p-5 rounded-2xl"
        >
          <Text className="text-white text-center font-bold">
            Pay ₱
            {formatMoney(
              schedule.find((i) => i.status === "unpaid")?.total_payment || 0,
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
