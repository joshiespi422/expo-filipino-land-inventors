import { Skeleton } from "@/components/ui/skeleton";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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

export default function CooperativeMembershipPage() {
  const router = useRouter();

  // 🛡️ NAVIGATION LOCKS
  const isProcessing = useRef(false);
  const [navigating, setNavigating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 📊 STATIC EXPENSE DATA
  const totalFund = "₱ 1,500,000";
  const expensesData = [
    {
      id: 1,
      category: "Member Dividends & Returns",
      amount: "₱ 600,000",
      percentage: "40%",
      color: "text-green-600",
    },
    {
      id: 2,
      category: "Operations & Maintenance",
      amount: "₱ 450,000",
      percentage: "30%",
      color: "text-blue-600",
    },
    {
      id: 3,
      category: "Community Projects",
      amount: "₱ 300,000",
      percentage: "20%",
      color: "text-orange-600",
    },
    {
      id: 4,
      category: "Emergency Reserve Fund",
      amount: "₱ 150,000",
      percentage: "10%",
      color: "text-red-600",
    },
  ];

  // RESET LOCKS ON FOCUS
  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      isProcessing.current = false;
    }, []),
  );

  /**
   * 📦 INITIAL LOAD
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 600); // Slightly longer to show off the new skeleton layout
    return () => clearTimeout(timer);
  }, []);

  /**
   * 🔄 FIXED REFRESH HANDLER
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // simulate reload
    setTimeout(() => {
      setPageLoading(true);

      setTimeout(() => {
        setPageLoading(false);
        setRefreshing(false);
      }, 500);
    }, 300);
  }, []);

  /**
   * 🚀 NAVIGATION
   */
  const handleBecomeMember = () => {
    if (isProcessing.current || navigating) return;

    isProcessing.current = true;
    setNavigating(true);

    // Route to your registration or form page
    router.push("/register-member");
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#034194"]}
            tintColor="#034194"
          />
        }
      >
        <View className="py-10 px-6">
          {/* HEADER & TEXT */}
          <View className="pb-8 w-full">
            {pageLoading ? (
              <View className="gap-y-3">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </View>
            ) : (
              <>
                <Text className="font-bold text-primary text-3xl mb-3">
                  Cooperative Transparency
                </Text>
                <Text className="text-slate-500 text-base leading-6">
                  Before you join, we want to show you exactly where the money
                  goes. Every peso is allocated to ensure growth, stability, and
                  community support.
                </Text>
              </>
            )}
          </View>

          {/* EXPENSES BREAKDOWN SECTION */}
          <View className="w-full">
            {pageLoading ? (
              <View className="gap-y-4">
                {/* Total skeleton */}
                <Skeleton className="h-24 w-full rounded-2xl mb-4" />
                {/* List skeletons */}
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </View>
            ) : (
              <>
                {/* TOTAL FUND CARD */}
                <View className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 items-center">
                  <Text className="text-slate-500 text-sm uppercase tracking-widest mb-1">
                    Total Pooled Fund
                  </Text>
                  <Text className="text-4xl font-black text-slate-800">
                    {totalFund}
                  </Text>
                </View>

                <Text className="text-xl font-bold text-slate-800 mb-4">
                  Fund Allocation
                </Text>

                {/* EXPENSES LIST */}
                <View className="gap-y-3">
                  {expensesData.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row justify-between items-center p-5 bg-white border border-slate-200 rounded-xl"
                    >
                      <View className="flex-1 pr-4">
                        <Text className="font-bold text-slate-700 text-base">
                          {item.category}
                        </Text>
                        <Text
                          className={`text-sm font-black mt-1 ${item.color}`}
                        >
                          {item.percentage}
                        </Text>
                      </View>
                      <Text className="font-bold text-slate-600 text-base">
                        {item.amount}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        {pageLoading ? (
          <Skeleton className="h-[60px] w-full rounded-2xl" />
        ) : (
          <TouchableOpacity
            onPress={handleBecomeMember}
            disabled={navigating}
            activeOpacity={0.8}
            className={`h-16 rounded-2xl justify-center items-center ${
              navigating ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {navigating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Become a Member
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
