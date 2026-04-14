import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

  // States
  const [pageLoading, setPageLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const isProcessing = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [navigating] = useState(false);

  // Updated Filter State to match your request
  const [activeFilter, setActiveFilter] = useState("All");

  // Updated Data to match Intellectual Property context
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

  const handleApplyForm = () => {
    if (isProcessing.current || isLoading || navigating) return;
    isProcessing.current = true;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/propertyForm"); // Updated route name
    }, 800);
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
                      onPress={() => setActiveFilter(filter)}
                      className={`mr-2 px-5 py-2 rounded-full border ${
                        activeFilter === filter
                          ? "bg-primary border-primary"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          activeFilter === filter
                            ? "text-white"
                            : "text-slate-400"
                        }`}
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
                      elevation: 8,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 12,
                      marginTop: 15,
                    }}
                    className="bg-white rounded-3xl overflow-hidden"
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
                                : "bg-[#FFE6E9]"
                          }`}
                        >
                          <Text
                            className={`font-bold text-[10px] uppercase ${
                              item.status === "Registered"
                                ? "text-green-700"
                                : item.status === "Pending"
                                  ? "text-amber-700"
                                  : "text-[#D70127]"
                            }`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View>
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
                          className="bg-primary/10 px-4 py-2 rounded-xl"
                        >
                          <Text className="text-primary font-bold text-[10px]">
                            Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Bottom accent line */}
                    <View
                      className={`h-1 w-full ${
                        item.status === "Registered"
                          ? "bg-green-500"
                          : item.status === "Pending"
                            ? "bg-amber-500"
                            : "bg-[#D70127]"
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
      <View className="px-6 pb-10 pt-5 bg-white shadow-2xl max-w-[500px] w-full self-center">
        {pageLoading ? (
          <Skeleton className="h-[60px] w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={handleApplyForm}
            disabled={isLoading || navigating}
            className={`p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
              isLoading || navigating ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {isLoading ? (
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
