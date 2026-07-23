import {
  fetchOrderForRatingAPI,
  fetchOrdersAPI,
  OrderListItem,
  PaginationMeta,
  RateItem,
} from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function ToRateScreen() {
  const router = useRouter(); // Fixed here
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Feedback details fetching states
  const [fetchingOrderId, setFetchingOrderId] = useState<number | null>(null);
  const [selectedFeedbackItems, setSelectedFeedbackItems] = useState<
    RateItem[]
  >([]);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const loadOrders = async (page = 1, shouldRefresh = false) => {
    try {
      if (page === 1 && !shouldRefresh) setLoading(true);
      const response = await fetchOrdersAPI("completed", page);

      if (response.success) {
        if (page === 1) {
          setOrders(response.data.orders);
        } else {
          setOrders((prev) => [...prev, ...response.data.orders]);
        }
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("[LOAD_RATE_ORDERS_ERROR]:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders(1);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders(1, true);
  };

  const handleLoadMore = () => {
    if (pagination && pagination.has_more && !loadingMore) {
      setLoadingMore(true);
      loadOrders(pagination.current_page + 1);
    }
  };

  // Fetch feedback specifically for an order
  const handleViewFeedback = async (orderId: number) => {
    try {
      setFetchingOrderId(orderId);
      const response = await fetchOrderForRatingAPI(orderId);

      if (response.success && response.data?.order) {
        setSelectedFeedbackItems(response.data.order.items);
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to load review feedback.",
        );
      }
    } catch (error) {
      console.error("[VIEW_FEEDBACK_ERROR]:", error);
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setFetchingOrderId(null);
    }
  };

  const renderOrderItem = ({ item }: { item: OrderListItem }) => {
    const isFetchingThis = fetchingOrderId === item.id;

    return (
      <View className="bg-white mb-3 p-4 rounded-2xl border border-slate-100 shadow-sm">
        {/* Header */}
        <View className="flex-row justify-between items-center pb-3 mb-3 border-b border-slate-100">
          <View className="flex-row items-center">
            <Ionicons name="storefront-outline" size={16} color="#334155" />
            <Text className="font-bold text-slate-800 text-sm ml-2">
              {item.store_name}
            </Text>
          </View>
          <Text className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            Completed
          </Text>
        </View>

        {/* Items list preview */}
        {item.items.map((prod, index) => (
          <View key={prod.id || index} className="flex-row mb-3">
            <Image
              source={{
                uri: prod.product_image || "https://via.placeholder.com/100",
              }}
              className="w-16 h-16 rounded-xl bg-slate-100"
              resizeMode="cover"
            />
            <View className="flex-1 ml-3 justify-center">
              <Text
                className="font-semibold text-slate-800 text-sm"
                numberOfLines={1}
              >
                {prod.product_name}
              </Text>
              {prod.variant_name && (
                <Text className="text-xs text-slate-400 mt-0.5">
                  Variation: {prod.variant_name}
                </Text>
              )}
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-xs font-bold text-slate-700">
                  ₱{Number(prod.price).toLocaleString()}
                </Text>
                <Text className="text-xs text-slate-400">x{prod.quantity}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Total & Actions Footer */}
        <View className="flex-row justify-between items-center pt-3 mt-1 border-t border-slate-100">
          <View>
            <Text className="text-[11px] text-slate-400">Total Amount</Text>
            <Text className="text-sm font-bold text-[#034194]">
              ₱{Number(item.total).toLocaleString()}
            </Text>
          </View>

          {item.is_rated ? (
            <TouchableOpacity
              onPress={() => handleViewFeedback(item.id)}
              disabled={isFetchingThis}
              className="border border-[#034194] bg-blue-50 px-4 py-2 rounded-xl flex-row items-center"
            >
              {isFetchingThis ? (
                <ActivityIndicator size="small" color="#034194" />
              ) : (
                <>
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={14}
                    color="#034194"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-xs text-[#034194] font-semibold">
                    View Feedback
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(store)/rate-order",
                  params: { orderId: item.id },
                })
              }
              className="bg-[#034194] px-5 py-2.5 rounded-xl flex-row items-center"
            >
              <Ionicons
                name="star-outline"
                size={14}
                color="#ffffff"
                style={{ marginRight: 4 }}
              />
              <Text className="text-xs text-white font-semibold">
                Rate Order
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#034194" />
        <Text className="text-xs text-slate-400 mt-2">Loading orders...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#034194" className="py-4" />
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 font-medium mt-3">
              No orders to rate yet.
            </Text>
          </View>
        }
      />

      {/* FEEDBACK DETAIL MODAL */}
      <Modal
        visible={selectedFeedbackItems.length > 0}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFeedbackItems([])}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedFeedbackItems([])}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
                {/* Header */}
                <View className="flex-row justify-between items-center pb-3 border-b border-slate-100">
                  <Text className="font-bold text-base text-slate-800">
                    Your Feedback
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedFeedbackItems([])}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={26} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Feedback List */}
                <ScrollView
                  className="mt-3"
                  showsVerticalScrollIndicator={true}
                >
                  {selectedFeedbackItems.map((item, idx) => {
                    const review = item.review;
                    const rating = review?.rating ?? 5;
                    const comment = review?.comment;
                    const images = review?.images || [];

                    return (
                      <View
                        key={item.id || idx}
                        className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200"
                      >
                        <Text className="font-bold text-slate-800 text-sm mb-1">
                          {item.product_name}
                        </Text>

                        {/* Stars */}
                        <View className="flex-row items-center mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name="star"
                              size={16}
                              color={s <= rating ? "#f59e0b" : "#cbd5e1"}
                              style={{ marginRight: 2 }}
                            />
                          ))}
                        </View>

                        {/* Review text */}
                        {comment ? (
                          <Text className="text-xs text-slate-700 leading-relaxed mb-3">
                            "{comment}"
                          </Text>
                        ) : (
                          <Text className="text-xs text-slate-400 italic mb-3">
                            No written comment provided.
                          </Text>
                        )}

                        {/* Review Images */}
                        {images.length > 0 && (
                          <View className="mb-3">
                            <Text className="text-[11px] font-semibold text-slate-400 mb-1.5">
                              Photos:
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              className="flex-row"
                            >
                              {images.map((imgUri, imgIdx) => (
                                <TouchableOpacity
                                  key={imgIdx}
                                  activeOpacity={0.8}
                                  onPress={() => setSelectedImageUri(imgUri)}
                                  className="mr-2"
                                >
                                  <Image
                                    source={{ uri: imgUri }}
                                    className="w-20 h-20 rounded-xl bg-slate-200"
                                    resizeMode="cover"
                                  />
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* FULLSCREEN IMAGE MODAL */}
      <Modal
        visible={!!selectedImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageUri(null)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity
            onPress={() => setSelectedImageUri(null)}
            className="absolute top-12 right-6 z-10"
          >
            <Ionicons name="close" size={32} color="#ffffff" />
          </TouchableOpacity>
          {selectedImageUri && (
            <Image
              source={{ uri: selectedImageUri }}
              className="w-full h-4/5"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
