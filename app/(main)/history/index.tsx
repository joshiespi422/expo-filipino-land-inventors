import { Skeleton } from "@/components/ui/skeleton";
import {
  getWalletTransactions,
  WalletTransaction,
} from "@/services/walletService";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const loadTransactions = async () => {
    try {
      const data = await getWalletTransactions();
      setTransactions(data);
    } catch (error) {
      console.log("Transaction Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, []);

  const getStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case "credit":
        return {
          label: "Received",
          color: "#16a34a",
          bg: "#dcfce7",
          icon: "arrow-down-circle",
        };

      case "debit":
        return {
          label: "Sent",
          color: "#dc2626",
          bg: "#fee2e2",
          icon: "arrow-up-circle",
        };

      default:
        return {
          label: "Transaction",
          color: "#475569",
          bg: "#e2e8f0",
          icon: "swap-horizontal",
        };
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View className="flex-1 bg-[#F6F8FB] px-5 pt-5">
      {/* HEADER */}
      <View className="mb-4">
        <Text className="text-2xl font-bold text-slate-800">
          Transaction History
        </Text>
        <Text className="text-slate-500 text-sm mt-1">
          Track all your wallet activity
        </Text>
      </View>

      {loading ? (
        <View className="gap-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              className="bg-white p-4 rounded-2xl flex-row items-center"
            >
              <Skeleton className="w-12 h-12 rounded-full" />
              <View className="flex-1 ml-3">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-24" />
              </View>
              <Skeleton className="h-4 w-20" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#034194"]}
              tintColor="#034194"
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-32">
              <Ionicons name="wallet-outline" size={80} color="#CBD5E1" />

              <Text className="text-lg font-semibold text-slate-400 mt-4">
                No Transactions Yet
              </Text>

              <Text className="text-slate-400 text-center mt-2 px-10">
                Your wallet activity will appear here once you start using the
                app.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const style = getStyle(item.type);

            return (
              <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100">
                <View className="flex-row items-center">
                  {/* ICON */}
                  <View
                    style={{ backgroundColor: style.bg }}
                    className="w-12 h-12 rounded-full items-center justify-center"
                  >
                    <Ionicons
                      name={style.icon as any}
                      size={24}
                      color={style.color}
                    />
                  </View>

                  {/* DETAILS */}
                  <View className="flex-1 ml-3">
                    <Text className="text-slate-800 font-semibold text-base">
                      {item.description || "Wallet Transaction"}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <Text className="text-slate-400 text-xs capitalize">
                        {style.label}
                      </Text>
                      <Text className="text-slate-300 text-xs mx-2">•</Text>
                      <Text className="text-slate-400 text-xs">
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* AMOUNT */}
                  <View className="items-end">
                    <Text
                      style={{ color: style.color }}
                      className="text-lg font-bold"
                    >
                      {item.type?.toLowerCase() === "credit" ? "+" : "-"}₱
                      {Number(item.amount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>

                    <View
                      style={{ backgroundColor: style.bg }}
                      className="px-2 py-1 rounded-full mt-1"
                    >
                      <Text
                        style={{ color: style.color }}
                        className="text-[10px] font-semibold"
                      >
                        {style.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
