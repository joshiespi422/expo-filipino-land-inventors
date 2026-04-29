import { Skeleton } from "@/components/ui/skeleton";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

import { getLoan } from "@/services/loanService";

export default function LoanPaymentPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loanData, setLoanData] = useState<any>(null);

  const [navigating, setNavigating] = useState(false);
  const isProcessing = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  /**
   * 🔒 LOAN STATUS
   */
  const loanStatus = (loanData?.attributes?.status || loanData?.status || "")
    .toLowerCase()
    .trim();

  const isPayable = loanStatus === "active" || loanStatus === "approved";

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
   * 📅 FORMAT DATE
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

  const fetchLoan = async (showSkeleton = true) => {
    if (!id || typeof id !== "string") return;
    try {
      if (showSkeleton) setPageLoading(true);

      const response = await getLoan(id, {
        include: "user,status,loanSchedules,loanPayments",
      });

      setLoanData(response?.data);
      setSchedule(formatBackendSchedule(response));
    } catch (error) {
      console.error("FETCH ERROR:", error);
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLoan(false);
  }, [id]);

  const nextToPayIndex = schedule.findIndex((i) => i.status === "unpaid");
  const nextToPayId =
    nextToPayIndex !== -1 ? schedule[nextToPayIndex]?.id : null;

  const outstanding = schedule
    .filter((i) => i.status === "unpaid")
    .reduce((a, b) => a + (b.total_payment || 0), 0);

  /**
   * 🚀 HANDLE PAYMENT
   */
  const handlePayment = () => {
    if (!isPayable) return;

    if (isProcessing.current || navigating) return;

    const firstUnpaid = schedule.find((i) => i.status === "unpaid");
    if (!firstUnpaid || !loanData?.id) return;

    isProcessing.current = true;
    setNavigating(true);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#034194"]}
            tintColor="#034194"
          />
        }
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
        {pageLoading
          ? [1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-24 w-full rounded-2xl mb-4" />
            ))
          : schedule.map((item) => {
              const isPaid = item.status === "paid";
              const isExpanded = expandedId === item.id;
              const isNext = item.id === nextToPayId;

              return (
                <View key={item.id} className="mb-4">
                  <View
                    className={`rounded-2xl p-4 border ${
                      isPaid
                        ? "bg-slate-100 border-slate-200 opacity-70"
                        : isNext
                          ? "bg-white border-yellow-300"
                          : "bg-white border-slate-100"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        {/* ✅ ONLY SHOW BADGE IF PAYABLE */}
                        {isPaid ? (
                          <View className="bg-green-100 px-2 py-1 rounded-full mr-3">
                            <Text className="text-green-600 text-[10px] font-bold">
                              PAID
                            </Text>
                          </View>
                        ) : isPayable && isNext ? (
                          <View className="bg-yellow-100 px-2 py-1 rounded-full mr-3">
                            <Text className="text-yellow-600 text-[10px] font-bold">
                              NEXT
                            </Text>
                          </View>
                        ) : isPayable ? (
                          <View className="bg-slate-100 px-2 py-1 rounded-full mr-3">
                            <Text className="text-slate-500 text-[10px] font-bold">
                              PENDING
                            </Text>
                          </View>
                        ) : null}

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

                    {/* PROGRESS */}
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

                    {/* 👇 SHOW/HIDE BUTTON */}
                    <TouchableOpacity
                      onPress={() => setExpandedId(isExpanded ? null : item.id)}
                      className="mt-3"
                    >
                      <Text className="text-primary text-xs font-bold">
                        {isExpanded ? "Hide Details" : "Show Details"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* DETAILS */}
                  {isExpanded && (
                    <View className="bg-white border border-slate-100 rounded-2xl mt-2 p-4 shadow-sm">
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500 text-xs">
                          Principal
                        </Text>
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

      {/* FOOTER */}
      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handlePayment}
          disabled={navigating || outstanding <= 0 || pageLoading || !isPayable}
          className={`h-16 rounded-2xl justify-center items-center ${
            navigating || outstanding <= 0 || pageLoading || !isPayable
              ? "bg-slate-300"
              : "bg-primary"
          }`}
        >
          {navigating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {!isPayable
                ? "View Only"
                : outstanding > 0
                  ? `Pay ₱${formatMoney(
                      schedule.find((i) => i.status === "unpaid")
                        ?.total_payment || 0,
                    )}`
                  : "Fully Paid"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
