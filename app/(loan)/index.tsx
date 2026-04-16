import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import loanAds from "../../assets/images/loanAssets.png";
import "../../global.css";

import { getLoanableAmount, getLoans } from "@/services/loanService";
import { Loan } from "@/types/loan.types";

export default function IndexPage() {
  const router = useRouter();

  // STATES
  const [pageLoading, setPageLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanableAmount, setLoanableAmount] = useState("0.00");

  const [settings, setSettings] = useState<{
    default_term_months: number;
    default_interest_rate: number;
  } | null>(null);

  const isProcessing = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [navigating] = useState(false);

  const [activeFilter, setActiveFilter] = useState("All");

  // =========================
  // FETCH LOANS FROM API
  // =========================
  const fetchLoans = async () => {
    try {
      setPageLoading(true);
      const res = await getLoans();
      const amount = await getLoanableAmount();

      setLoans(res.data);
      setLoanableAmount(amount);
      setSettings(res.meta?.settings ?? null);
    } catch (error) {
      console.log("Failed to fetch loans:", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // =========================
  // FILTERED LOANS
  // =========================
  const filteredHistory = loans.filter((loan) => {
    if (activeFilter === "All") return true;
    return loan.attributes.status.toLowerCase() === activeFilter.toLowerCase();
  });

  // REMOVED: const { amount, start_date, status } = loan.attributes;
  // (You cannot do this here because "loan" is not defined yet)

  // =========================
  // FILTER LOADING UI
  // =========================
  useEffect(() => {
    if (pageLoading) return;

    setFilterLoading(true);
    const timer = setTimeout(() => {
      setFilterLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeFilter]);

  const handleViewDetails = (id: number) => {
    router.push(`/breakdown?id=${id}`);
  };

  const handleLoanForm = () => {
    if (isProcessing.current || isLoading || navigating) return;
    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/loanForm");
    }, 600);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pb-10 px-5 pt-8">
          <View className="w-full max-w-[500px] mx-auto">
            {/* BANNER */}
            {pageLoading ? (
              <View className="px-4">
                <Skeleton className="!w-full !h-36 rounded-2xl" />
              </View>
            ) : (
              <Image
                source={loanAds}
                className="!w-full !h-36 rounded-2xl"
                resizeMode="contain"
              />
            )}

            <View style={{ width: 305 }} className="mx-auto">
              {/* LOANABLE AMOUNT */}
              <View
                style={{
                  marginTop: -31,
                  zIndex: 50,
                  elevation: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                }}
                className="bg-white rounded-2xl border border-primary/20 p-4"
              >
                {pageLoading ? (
                  <View className="gap-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-48" />
                  </View>
                ) : (
                  <>
                    <Text className="text-primary text-md">
                      Loanable Amount
                    </Text>
                    <Text className="text-primary text-3xl pt-2 font-bold">
                      ₱{Number(loanableAmount).toLocaleString()}
                    </Text>
                  </>
                )}
              </View>

              {/* LOAN DETAILS SECTION (Settings) */}
              <View
                style={{
                  elevation: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  marginTop: 20,
                }}
                className="bg-white rounded-2xl border border-primary/20 overflow-hidden"
              >
                <View className="flex-row justify-between">
                  <View className="p-4 flex-1">
                    {pageLoading ? (
                      <View className="gap-y-4">
                        <Skeleton className="h-6 w-24" />
                        <View className="flex-row gap-6">
                          <Skeleton className="h-12 w-12" />
                          <Skeleton className="h-12 w-12" />
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text className="text-lg font-semibold">
                          Loan Details
                        </Text>
                        <View className="flex-row gap-6 justify-between mt-2">
                          <View>
                            <Text className="text-primary text-xs font-bold">
                              Payable in
                            </Text>
                            <Text className="text-primary text-2xl font-bold">
                              {settings?.default_term_months ?? 0}
                            </Text>
                            <Text className="text-primary text-[10px]">
                              Months
                            </Text>
                          </View>
                          <View>
                            <Text className="text-primary text-xs font-bold">
                              Interest
                            </Text>
                            <Text className="text-primary text-2xl font-bold">
                              {settings?.default_interest_rate ?? 0}%
                            </Text>
                            <Text className="text-primary text-[10px]">
                              ave per mo.
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                  <View className="bg-primary w-24 items-center justify-center">
                    <Text className="text-white font-bold uppercase text-center">
                      Need{"\n"}Help?
                    </Text>
                  </View>
                </View>
              </View>

              {/* FILTER TABS */}
              <View className="pt-8">
                <Text className="text-center text-primary font-bold text-xl mb-5">
                  Loan History
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {["All", "pending", "active", "finished", "rejected"].map(
                    (filter) => (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setActiveFilter(filter)}
                        className={`mr-2 px-5 py-2 rounded-full border ${
                          activeFilter === filter
                            ? "bg-primary border-primary"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${activeFilter === filter ? "text-white" : "text-slate-400"}`}
                        >
                          {filter.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>
              </View>

              {/* LOAN LIST */}
              <View className="mt-2">
                {pageLoading || filterLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <View
                      key={i}
                      className="bg-white rounded-3xl p-5 mt-4 border border-slate-100"
                    >
                      <View className="flex-row justify-between mb-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </View>
                      <View className="flex-row justify-between">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-12 rounded-xl" />
                      </View>
                    </View>
                  ))
                ) : filteredHistory.length > 0 ? (
                  filteredHistory.map((loan) => {
                    const {
                      amount,
                      start_date,
                      end_date,
                      status,
                      term_months,
                    } = loan.attributes;
                    const normalizedStatus = status.toLowerCase();

                    const formatDate = (dateString: string) => {
                      if (!dateString) return "";
                      const date = new Date(dateString);
                      return new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "2-digit",
                        year: "numeric",
                      }).format(date);
                    };

                    // =========================
                    // STATUS STYLE PICKER
                    // =========================
                    const getStatusStyles = (status: string) => {
                      switch (status) {
                        case "active":
                          return { bg: "bg-green-100", text: "text-green-700" };
                        case "pending":
                          return { bg: "bg-amber-100", text: "text-amber-700" };
                        case "finished":
                          return { bg: "bg-blue-100", text: "text-blue-700" };
                        case "rejected":
                          return { bg: "bg-[#FFE6E9]", text: "text-[#D70127]" };
                        default:
                          return { bg: "bg-slate-100", text: "text-slate-700" };
                      }
                    };

                    const statusStyle = getStatusStyles(normalizedStatus);

                    return (
                      <View
                        key={loan.id}
                        style={{
                          elevation: 8,
                          shadowColor: "#000",
                          shadowOpacity: 0.1,
                          shadowRadius: 12,
                          marginTop: 15,
                        }}
                        className="bg-white rounded-3xl overflow-hidden border border-slate-50"
                      >
                        <View className="p-5">
                          {/* HEADER: DATES & STATUS */}
                          <View className="flex-row justify-between mb-4 items-center">
                            <View className="flex-1">
                              <View className="flex-row items-center">
                                <Text className="text-[10px] font-bold text-slate-500">
                                  {formatDate(start_date)}
                                </Text>
                                {end_date && (
                                  <>
                                    <Text className="text-[10px] text-slate-300 mx-2">
                                      |
                                    </Text>
                                    <Text className="text-[10px] font-bold text-slate-500">
                                      {formatDate(end_date)}
                                    </Text>
                                  </>
                                )}
                              </View>
                              {/* ADDED: MONTHS SUBTITLE */}
                              <Text className="text-[9px] text-primary font-bold uppercase mt-0.5">
                                {term_months} Months Term
                              </Text>
                            </View>

                            <View
                              className={`px-3 py-1 rounded-full ${statusStyle.bg}`}
                            >
                              <Text
                                className={`text-[10px] font-bold uppercase ${statusStyle.text}`}
                              >
                                {status}
                              </Text>
                            </View>
                          </View>

                          {/* BODY: AMOUNT & ACTION */}
                          <View className="flex-row justify-between items-center border-t border-slate-50 pt-3">
                            <View>
                              <Text className="text-[9px] text-slate-400 uppercase font-bold">
                                Total Amount
                              </Text>
                              <Text className="text-2xl font-black text-slate-900">
                                ₱{Number(amount).toLocaleString()}
                              </Text>
                            </View>

                            {/* ACTION BUTTON */}
                            <TouchableOpacity
                              onPress={() => handleViewDetails(loan.id)}
                              className="bg-primary px-5 py-2.5 rounded-xl shadow-sm shadow-primary/20"
                            >
                              <Text className="text-white font-bold text-[11px]">
                                View Details
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View
                          className={`h-1 w-full ${
                            status === "active"
                              ? "bg-green-500"
                              : status === "pending"
                                ? "bg-amber-500"
                                : status === "finished"
                                  ? "bg-blue-500"
                                  : status === "rejected"
                                    ? "bg-[#D70127]"
                                    : "bg-slate-500"
                          }`}
                        />
                      </View>
                    );
                  })
                ) : (
                  <Text className="text-center text-slate-400 mt-10">
                    No records found.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View className="px-6 pb-10 pt-5 bg-white max-w-[500px] w-full self-center">
        {pageLoading ? (
          <Skeleton className="h-[60px] w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={handleLoanForm}
            disabled={isLoading || navigating}
            className={`p-5 rounded-2xl flex-row justify-center ${
              isLoading ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Get Started</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
