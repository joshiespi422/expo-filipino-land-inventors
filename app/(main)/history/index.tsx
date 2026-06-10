import { Skeleton } from "@/components/ui/skeleton";
import {
  getWalletTransactions,
  WalletTransaction,
} from "@/services/walletService";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransaction | null>(null);

  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">(
    "all",
  );

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

  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((item) => {
      const created = new Date(item.created_at);

      if (filter === "today") {
        return created.toDateString() === now.toDateString();
      }

      if (filter === "week") {
        const diff =
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

        return diff <= 7;
      }

      if (filter === "month") {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });
  }, [transactions, filter]);

  const getStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case "deposit":
        return {
          label: "Money In",
          color: "#16a34a",
          bg: "#dcfce7",
          icon: "arrow-down",
          sign: "+",
        };

      case "withdrawal":
        return {
          label: "Money Out",
          color: "#dc2626",
          bg: "#fee2e2",
          icon: "arrow-up",
          sign: "-",
        };

      default:
        return {
          label: "Transaction",
          color: "#475569",
          bg: "#e2e8f0",
          icon: "swap-horizontal",
          sign: "",
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

  const renderFilterButton = (
    label: string,
    value: "all" | "today" | "week" | "month",
  ) => {
    const active = filter === value;

    return (
      <TouchableOpacity
        onPress={() => setFilter(value)}
        className={`px-4 py-2 rounded-full mr-2 ${
          active ? "bg-[#034194]" : "bg-white border border-slate-200"
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            active ? "text-white" : "text-slate-600"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC] px-4 pt-10">
      {/* FILTER */}
      <View className="flex-row mb-5">
        {renderFilterButton("All", "all")}
        {renderFilterButton("Today", "today")}
        {renderFilterButton("7 Days", "week")}
        {renderFilterButton("This Month", "month")}
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
          data={filteredTransactions}
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
                No Transactions Found
              </Text>

              <Text className="text-slate-400 text-center mt-2 px-10">
                Your wallet transaction history will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const style = getStyle(item.type);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedTransaction(item)}
                className="bg-white rounded-2xl px-4 py-4 mb-3 border border-slate-100"
              >
                <View className="flex-row items-center">
                  {/* ICON */}
                  <View
                    style={{ backgroundColor: style.bg }}
                    className="w-12 h-12 rounded-full items-center justify-center"
                  >
                    <Ionicons
                      name={style.icon as any}
                      size={22}
                      color={style.color}
                    />
                  </View>

                  {/* DETAILS */}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-slate-800">
                      {item.description || "Wallet Transaction"}
                    </Text>

                    <Text className="text-xs text-slate-400 mt-1">
                      {formatDate(item.created_at)}
                    </Text>
                  </View>

                  {/* AMOUNT */}
                  <View className="items-end">
                    <Text
                      style={{ color: style.color }}
                      className="text-base font-bold"
                    >
                      {style.sign}₱
                      {Number(item.amount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>

                    <Text
                      style={{ color: style.color }}
                      className="text-xs mt-1"
                    >
                      {style.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* DETAILS MODAL */}
      <Modal
        visible={!!selectedTransaction}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setSelectedTransaction(null)}
        >
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-[30px] p-5 pb-8 w-full">
              {selectedTransaction && (
                <>
                  <View className="items-center mb-5">
                    <View className="w-14 h-1.5 rounded-full bg-slate-200 mb-5" />

                    <Text className="text-xl font-bold text-slate-800">
                      Transaction Details
                    </Text>
                  </View>

                  {(() => {
                    const style = getStyle(selectedTransaction.type);

                    return (
                      <>
                        <View className="items-center mb-6">
                          <View
                            style={{ backgroundColor: style.bg }}
                            className="w-20 h-20 rounded-full items-center justify-center"
                          >
                            <Ionicons
                              name={style.icon as any}
                              size={38}
                              color={style.color}
                            />
                          </View>

                          <Text
                            style={{ color: style.color }}
                            className="text-3xl font-bold mt-4"
                          >
                            {style.sign}₱
                            {Number(selectedTransaction.amount).toLocaleString(
                              "en-PH",
                              { minimumFractionDigits: 2 },
                            )}
                          </Text>

                          <Text className="text-slate-500 mt-1">
                            {style.label}
                          </Text>
                        </View>

                        <View className="bg-slate-50 rounded-2xl p-4">
                          <View className="flex-row justify-between py-3 border-b border-slate-200">
                            <Text className="text-slate-400">Description</Text>
                            <Text className="font-medium text-slate-700 max-w-[60%] text-right">
                              {selectedTransaction.description ||
                                "Wallet Transaction"}
                            </Text>
                          </View>

                          <View className="flex-row justify-between py-3 border-b border-slate-200">
                            <Text className="text-slate-400">Type</Text>
                            <Text className="font-medium text-slate-700 capitalize">
                              {selectedTransaction.type}
                            </Text>
                          </View>

                          <View className="flex-row justify-between py-3 border-b border-slate-200">
                            <Text className="text-slate-400">Reference ID</Text>
                            <Text className="font-medium text-slate-700">
                              {selectedTransaction.reference_id || "N/A"}
                            </Text>
                          </View>

                          <View className="flex-row justify-between py-3">
                            <Text className="text-slate-400">Date</Text>
                            <Text className="font-medium text-slate-700 max-w-[60%] text-right">
                              {formatDate(selectedTransaction.created_at)}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => setSelectedTransaction(null)}
                          className="bg-[#034194] rounded-2xl py-4 mt-6"
                        >
                          <Text className="text-white text-center font-semibold">
                            Close
                          </Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Fixed standard style object for the overlay backdrop
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
