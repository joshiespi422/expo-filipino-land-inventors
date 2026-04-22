import { Skeleton } from "@/components/ui/skeleton";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

export default function IndexPage() {
  const router = useRouter();

  // 🛡️ STRICT LOCK STATES
  const isProcessing = useRef(false);
  const [navigating, setNavigating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  // RESET LOCKS ON FOCUS
  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  const PROPERTY_HISTORY = [
    {
      id: 1,
      title: "Logo Design A",
      status: "Registered",
      date: "March 12, 2026",
    },
    {
      id: 2,
      title: "Software Patent",
      status: "Pending",
      date: "Reviewing...",
    },
    {
      id: 3,
      title: "Brand Slogan",
      status: "Rejected",
      date: "Incomplete Docs",
    },
    { id: 4, title: "Old Invention", status: "Expired", date: "Jan 05, 2024" },
    {
      id: 5,
      title: "Mobile App UI",
      status: "Registered",
      date: "April 01, 2026",
    },
  ];

  const filteredHistory = PROPERTY_HISTORY.filter((item) => {
    if (activeFilter === "All") return true;
    return item.status === activeFilter;
  });

  // Effect: Initial Page Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Effect: Filter Change Loading
  useEffect(() => {
    if (pageLoading) return;
    setFilterLoading(true);
    const timer = setTimeout(() => {
      setFilterLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [activeFilter]);

  /**
   * 🚀 HANDLE NAVIGATION ACTIONS
   */
  const handleViewDetails = () => {
    if (isProcessing.current || navigating) return;
    isProcessing.current = true;
    setNavigating(true);
    router.push("/breakdown");
  };

  const handleApplyForm = () => {
    // ⛔ STRICT CLICK CHECK
    if (isProcessing.current || navigating) return;

    isProcessing.current = true;
    setNavigating(true);

    // Minor delay to show loader before push
    setTimeout(() => {
      router.push("/propertyForm");
    }, 100);
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pb-10 px-5">
          <View className="w-full max-w-[500px] mx-auto">
            {/* HEADER SECTION */}
            <View className="pt-7">
              {pageLoading ? (
                <Skeleton className="h-10 w-64 self-center mb-6" />
              ) : (
                <Text className="text-center text-primary font-bold text-3xl mb-6">
                  Registered Property
                </Text>
              )}

              {/* FILTER TABS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row mb-2"
              >
                {["All", "Registered", "Pending", "Rejected", "Expired"].map(
                  (filter) => (
                    <TouchableOpacity
                      key={filter}
                      disabled={navigating}
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
                  ),
                )}
              </ScrollView>
            </View>

            {/* PROPERTY LIST SECTION */}
            <View className="mt-2">
              {pageLoading || filterLoading ? (
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
                filteredHistory.map((item) => (
                  <View
                    key={`card-${item.id}`}
                    style={{
                      elevation: 4,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      marginTop: 15,
                    }}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-50"
                  >
                    <View className="p-5">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                          Ref ID: #IP-{item.id}099
                        </Text>
                        <View
                          className={`px-3 py-1 rounded-full ${
                            item.status === "Registered"
                              ? "bg-green-100"
                              : item.status === "Pending"
                                ? "bg-amber-100"
                                : "bg-red-50"
                          }`}
                        >
                          <Text
                            className={`font-bold text-[10px] uppercase ${
                              item.status === "Registered"
                                ? "text-green-700"
                                : item.status === "Pending"
                                  ? "text-amber-700"
                                  : "text-red-600"
                            }`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                          <Text className="text-slate-800 text-xl font-bold">
                            {item.title}
                          </Text>
                          <Text className="text-slate-500 text-xs mt-1">
                            {item.status === "Registered"
                              ? `Valid until: ${item.date}`
                              : item.date}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={handleViewDetails}
                          disabled={navigating}
                          className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
                        >
                          <Text className="text-primary font-bold text-[10px]">
                            Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View
                      className={`h-1 w-full ${
                        item.status === "Registered"
                          ? "bg-green-500"
                          : item.status === "Pending"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                  </View>
                ))
              ) : (
                <View className="py-20 items-center">
                  <Text className="text-slate-400 italic">
                    No {activeFilter.toLowerCase()} records found.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTION BUTTON */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        {pageLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={handleApplyForm}
            disabled={navigating}
            className={`h-16 rounded-2xl justify-center items-center ${
              navigating ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {navigating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Apply New</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
