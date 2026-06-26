import {
  fetchOrdersAPI,
  OrderListItem,
  PaginationMeta,
} from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const filterTabs = [
  { label: "All", slug: "all" },
  { label: "To Pay", slug: "to-pay" },
  { label: "To Ship", slug: "to-ship" },
  { label: "To Receive", slug: "to-receive" },
  { label: "Completed", slug: "completed" },
  { label: "Cancelled", slug: "cancelled" },
  { label: "Returned", slug: "returned" },
];

export default function OrderList() {
  const router = useRouter();
  const { status: routeStatus } = useLocalSearchParams<{ status?: string }>();

  const [selectedSlug, setSelectedSlug] = useState<string>("all");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // FIXED: Standardized dependencies to stop execution race patterns
  const getOrders = useCallback(
    async (page: number = 1, clearExisting: boolean = false) => {
      try {
        if (page === 1 && !clearExisting) setIsLoading(true);
        if (page > 1) setIsLoadingMore(true);

        const response = await fetchOrdersAPI(selectedSlug, page);

        if (response.success) {
          setOrders((prev) =>
            page === 1
              ? response.data.orders
              : [...prev, ...response.data.orders],
          );
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error("❌ [FETCH_ORDERS_ERROR]:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [selectedSlug],
  );

  // Sync route param with tab selection state safely
  useEffect(() => {
    if (routeStatus) {
      const activeTab = filterTabs.find(
        (t) =>
          t.slug === routeStatus ||
          t.label.toLowerCase() === routeStatus.toLowerCase(),
      );
      if (activeTab) {
        setSelectedSlug(activeTab.slug);
        return;
      }
    }
    setSelectedSlug("all");
  }, [routeStatus]);

  // Handle fetching triggers cleanly when component shifts tabs
  useEffect(() => {
    getOrders(1, false);
  }, [getOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    getOrders(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination?.has_more) {
      getOrders(pagination.current_page + 1, false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      {/* HEADER BAR ROW */}
      <View className="bg-white px-4 pt-5 pb-3 flex-row items-center border-b border-slate-100">
        <TouchableOpacity
          onPress={() => router.push("/home")}
          className="mr-3 p-1"
        >
          <Ionicons name="home-outline" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text className="font-bold text-xl text-slate-800">Return Home</Text>
      </View>

      {/* FILTER TABS SCROLL BAR */}
      <View className="bg-white py-3 border-b border-slate-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-3"
        >
          {filterTabs.map((tab) => {
            const isTabActive = selectedSlug === tab.slug;
            return (
              <TouchableOpacity
                key={tab.slug}
                onPress={() => setSelectedSlug(tab.slug)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  isTabActive
                    ? "bg-[#034194] border-[#034194]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text
                  className={`font-medium text-xs ${isTabActive ? "text-white" : "text-slate-600"}`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* RENDER LIST COMPONENT */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#034194" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#034194"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl mb-4 p-4 border border-slate-200 shadow-sm">
              {/* SHOP HEADER */}
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Ionicons
                    name="storefront-outline"
                    size={18}
                    color="#034194"
                  />
                  <Text className="ml-2 font-bold text-slate-800">
                    {item.store_name || "Unknown Shop"}
                  </Text>
                </View>
                <Text className="text-[#034194] font-semibold text-xs bg-blue-50 px-2 py-1 rounded-md">
                  {item.status_label}
                </Text>
              </View>

              {/* PRODUCTS */}
              {item.items?.map((product, index) => (
                <View
                  key={`${product.product_name}-${index}`}
                  className="flex-row mb-3"
                >
                  <Image
                    source={{
                      // 💡 APPLY IMAGE VARIANT PARSING LOGIC HERE:
                      uri:
                        product.product_image &&
                        product.product_image.startsWith("http")
                          ? product.product_image
                          : `http://192.168.1.46:8000${product.product_image || ""}`,
                    }}
                    style={{
                      width: 75,
                      height: 75,
                      borderRadius: 12,
                      backgroundColor: "#f1f5f9",
                    }}
                  />
                  <View className="flex-1 ml-3 justify-between">
                    <View>
                      <Text
                        numberOfLines={2}
                        className="font-medium text-slate-800 text-sm"
                      >
                        {product.product_name}
                      </Text>
                      {product.variant_name ? (
                        <Text className="text-[11px] text-slate-400 mt-0.5">
                          {product.variant_name}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row justify-between items-center mt-1">
                      <Text className="text-[#034194] font-bold">
                        ₱{product.price}
                      </Text>
                      <Text className="text-slate-400 text-xs">
                        x{product.quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* BILLING AND ACTIONS SUB-SECTION */}
              <View className="border-t border-slate-100 pt-3 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400 text-xs">Order Total</Text>
                  <Text className="font-bold text-base text-slate-800">
                    ₱{item.total}
                  </Text>
                </View>
              </View>

              {/* ACTION TRIGGERS CONTAINER */}
              <View className="flex-row justify-end mt-4 gap-2">
                {item.status === "to-pay" && (
                  <TouchableOpacity className="border border-red-500 px-4 py-2 rounded-xl">
                    <Text className="text-red-500 text-xs font-semibold">
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === "completed" && (
                  <TouchableOpacity className="border border-orange-500 px-4 py-2 rounded-xl">
                    <Text className="text-orange-500 text-xs font-semibold">
                      Refund
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => router.push(`/orders/${item.id}`)}
                  className="bg-[#034194] px-4 py-2 rounded-xl"
                >
                  <Text className="text-white text-xs font-semibold">
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="receipt-outline" size={48} color="#94a3b8" />
              <Text className="text-slate-500 font-semibold mt-2">
                No orders found
              </Text>
              <Text className="text-slate-400 text-xs mt-1 text-center px-6">
                There are no orders matching this selection status.
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#034194" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
