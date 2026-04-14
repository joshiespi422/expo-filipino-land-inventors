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

export default function IndexPage() {
  const router = useRouter();

  // States
  const [pageLoading, setPageLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const isProcessing = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [navigating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const LOAN_HISTORY = [
    { id: 1, amount: 16000, status: "Approved", date: "March 12, 2026" },
    { id: 2, amount: 5000, status: "Pending", date: "Reviewing..." },
    { id: 3, amount: 10000, status: "Rejected", date: "Incomplete Docs" },
    { id: 4, amount: 2500, status: "Approved", date: "April 05, 2026" },
    { id: 5, amount: 12000, status: "Pending", date: "Verification" },
  ];

  const filteredHistory = LOAN_HISTORY.filter((loan) => {
    if (activeFilter === "All") return true;
    return loan.status === activeFilter;
  });

  // Effect 1: Initial Page Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Effect 2: Filter Change Loading
  useEffect(() => {
    if (pageLoading) return;

    setFilterLoading(true);
    const timer = setTimeout(() => {
      setFilterLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [activeFilter]);

  const handleViewDetails = () => {
    router.push("/breakdown");
  };

  const handleLoanForm = () => {
    if (isProcessing.current || isLoading || navigating) return;
    isProcessing.current = true;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/loanForm");
    }, 800);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pb-10 pt-8">
          <View className="w-full max-w-[500px] mx-auto">
            {/* 1. BANNER */}
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
              {/* 2. LOANABLE AMOUNT CARD */}
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
                      ₱16,000.00
                    </Text>
                  </>
                )}
              </View>

              {/* 3. LOAN DETAILS CARD */}
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
                              12
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
                              0.03%
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

              {/* 4. FILTER SECTION */}
              <View className="pt-8">
                <Text className="text-center text-primary font-bold text-xl mb-5">
                  Loan History
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row mb-2"
                >
                  {["All", "Approved", "Pending", "Rejected"].map((filter) => (
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
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 5. LOAN LIST SECTION - THE FIX */}
              <View className="mt-2">
                {pageLoading || filterLoading ? (
                  // Strictly show skeletons only during any loading state
                  Array.from({ length: 3 }).map((_, i) => (
                    <View
                      key={`skeleton-${i}`}
                      className="bg-white rounded-3xl p-5 mt-4 border border-slate-100"
                    >
                      <View className="flex-row justify-between mb-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-12 rounded-xl" />
                      </View>
                    </View>
                  ))
                ) : filteredHistory.length > 0 ? (
                  // Strictly show real data only when loading is false
                  filteredHistory.map((loan) => (
                    <View
                      key={`loan-card-${loan.id}`}
                      style={{
                        elevation: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        marginTop: 15,
                        zIndex: 1,
                      }}
                      className="bg-white rounded-3xl overflow-hidden"
                    >
                      <View className="p-5">
                        <View className="flex-row justify-between items-center mb-4">
                          <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            Ref ID: #{loan.id}0245
                          </Text>
                          <View
                            className={`px-3 py-1 rounded-full ${
                              loan.status === "Approved"
                                ? "bg-green-100"
                                : loan.status === "Pending"
                                  ? "bg-amber-100"
                                  : "bg-[#FFE6E9]"
                            }`}
                          >
                            <Text
                              className={`font-bold text-[10px] uppercase ${
                                loan.status === "Approved"
                                  ? "text-green-700"
                                  : loan.status === "Pending"
                                    ? "text-[#C6890F]"
                                    : "text-[#D70127]"
                              }`}
                            >
                              {loan.status}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text className="text-slate-800 text-2xl font-bold">
                              ₱
                              {loan.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </Text>
                            <Text className="text-slate-500 text-xs mt-1">
                              {loan.status === "Approved"
                                ? `Due: ${loan.date}`
                                : loan.date}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={handleViewDetails}
                            className="bg-primary/10 px-4 py-2 rounded-xl"
                          >
                            <Text className="text-primary font-bold text-[10px]">
                              View
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View
                        className={`h-1 w-full ${
                          loan.status === "Approved"
                            ? "bg-green-500"
                            : loan.status === "Pending"
                              ? "bg-[#C6890F]"
                              : "bg-[#D70127]"
                        }`}
                      />
                    </View>
                  ))
                ) : (
                  <View className="py-10 items-center">
                    <Text className="text-slate-400 italic">
                      No {activeFilter.toLowerCase()} loans found.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 6. BOTTOM BUTTON */}
      <View className="px-6 pb-10 pt-5 bg-white shadow-2xl max-w-[500px] w-full self-center">
        {pageLoading ? (
          <Skeleton className="h-[60px] w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={handleLoanForm}
            disabled={isLoading || navigating}
            className={`p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
              isLoading || navigating ? "bg-slate-400" : "bg-primary"
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
