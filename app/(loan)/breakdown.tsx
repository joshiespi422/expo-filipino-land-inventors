import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

const MAX_LIMIT = 16000;
const MONTHS = 12;
const INTEREST_RATE = 0.03;

export default function LoanPaymentPage() {
  const router = useRouter();

  // States
  const [pageLoading, setPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const schedule = useMemo(() => {
    const P = MAX_LIMIT;
    const n = MONTHS;
    const r = INTEREST_RATE;
    const fixedPrincipal = P / n;
    let currentBalance = P;
    const data = [];
    const today = new Date();

    for (let i = 1; i <= n; i++) {
      const interestForMonth = currentBalance * r;
      const totalMonthlyPayment = fixedPrincipal + interestForMonth;
      const dueDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        today.getDate(),
      );

      data.push({
        id: i,
        month: i,
        totalPayment: totalMonthlyPayment,
        interest: interestForMonth,
        principal: fixedPrincipal,
        penalties: 0,
        lateFees: 0,
        dueDate: dueDate.toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: i <= 2 ? "Paid" : "Unpaid",
      });
      currentBalance -= fixedPrincipal;
    }
    return data;
  }, []);

  // Initial Load Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pageLoading) return;
    const firstUnpaid = schedule.find((item) => item.status === "Unpaid");
    if (firstUnpaid) {
      setSelectedIds([firstUnpaid.id]);
    }
  }, [schedule, pageLoading]);

  const totalToPay = selectedIds.reduce((sum, id) => {
    const item = schedule.find((s) => s.id === id);
    return sum + (item?.totalPayment || 0);
  }, 0);

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePayment = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(
        `Payment of ₱${totalToPay.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })} successful!`,
      );
      setSelectedIds([]);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 180 }}
      >
        {/* 1. SUMMARY CARD */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <View className="flex-row justify-between items-start">
            {pageLoading ? (
              <View className="gap-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-48" />
              </View>
            ) : (
              <View>
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Outstanding Balance
                </Text>
                <Text className="text-primary text-3xl font-black mt-1">
                  ₱13,333.34
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

        {/* 2. INSTALLMENTS LIST */}
        <View>
          {pageLoading
            ? // Skeleton Loop
              Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={`skeleton-${i}`}
                  className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-white shadow-sm"
                >
                  <Skeleton className="w-7 h-7 rounded-lg mr-4" />
                  <View className="flex-1 gap-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </View>
                  <View className="items-end gap-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-2 w-10" />
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
                      activeOpacity={0.9}
                      onPress={() => setExpandedId(isExpanded ? null : item.id)}
                      className={`flex-row items-center p-4 rounded-t-2xl border-t border-x ${
                        isPaid
                          ? "bg-slate-200 border-slate-100 opacity-80"
                          : isSelected
                            ? "bg-primary border-primary"
                            : "bg-white border-white"
                      } ${!isExpanded ? "rounded-b-2xl border-b shadow-sm" : ""}`}
                    >
                      {/* CHECKBOX AREA */}
                      <TouchableOpacity
                        onPress={() => !isPaid && toggleSelection(item.id)}
                        className="mr-4 p-1"
                      >
                        {isPaid ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={26}
                            color="#22c55e"
                          />
                        ) : (
                          <View
                            className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${
                              isSelected
                                ? "bg-white border-white"
                                : "border-slate-200"
                            }`}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#3b82f6"
                              />
                            )}
                          </View>
                        )}
                      </TouchableOpacity>

                      <View className="flex-1">
                        <Text
                          className={`font-bold text-sm ${isSelected ? "text-white" : "text-slate-800"}`}
                        >
                          Installment {item.month}
                        </Text>
                        <Text
                          className={`text-[11px] ${isSelected ? "text-white/80" : "text-slate-400"}`}
                        >
                          Due: {item.dueDate}
                        </Text>
                      </View>

                      <View className="items-end mr-2">
                        <Text
                          className={`font-black text-sm ${isSelected ? "text-white" : isPaid ? "text-slate-400" : "text-primary"}`}
                        >
                          ₱
                          {item.totalPayment.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                        <Text
                          className={`text-[9px] font-bold uppercase ${isSelected ? "text-white/70" : isPaid ? "text-green-500" : "text-orange-400"}`}
                        >
                          {item.status}
                        </Text>
                      </View>

                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={isSelected ? "white" : "#cbd5e1"}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View
                        className={`p-4 rounded-b-2xl border-x border-b shadow-sm ${isSelected ? "bg-blue-50 border-primary" : isPaid ? "bg-slate-200 border-slate-200" : "bg-white border-slate-100"}`}
                      >
                        <BreakdownRow
                          label="Principal Due"
                          value={item.principal}
                        />
                        <BreakdownRow
                          label="Interest Due"
                          value={item.interest}
                        />
                        <BreakdownRow
                          label="Penalties Due"
                          value={item.penalties}
                        />
                        <BreakdownRow
                          label="Late Fees Due"
                          value={item.lateFees}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
        </View>
      </ScrollView>

      {/* 3. FIXED BOTTOM BUTTON AREA */}
      <View className="px-6 pb-10 pt-4 bg-white shadow-2xl absolute bottom-0 w-full self-center border-t border-slate-50">
        {pageLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : (
          <>
            {selectedIds.length > 0 && (
              <View className="flex-row justify-between items-center mb-4 px-2">
                <Text className="text-slate-500 font-bold">
                  Total Amount To Pay:
                </Text>
                <Text className="text-primary font-black text-xl">
                  ₱
                  {totalToPay.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handlePayment}
              disabled={isLoading || selectedIds.length === 0}
              activeOpacity={0.8}
              className={`p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                isLoading || selectedIds.length === 0
                  ? "bg-slate-400"
                  : "bg-primary"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {selectedIds.length > 0
                    ? `Pay ₱${totalToPay.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
                    : "Select Installment"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between mb-1.5">
      <Text className="text-slate-500 text-[11px] font-medium">{label}</Text>
      <Text className="text-slate-700 text-[11px] font-bold">
        ₱{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}
