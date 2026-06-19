import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const filters = [
  "All",
  "To Pay",
  "To Ship",
  "To Receive",
  "Completed",
  "Cancelled",
  "Returned",
];

const initialOrders = [
  {
    id: "1",
    shop: "Fashion Store",
    status: "To Ship",
    date: "June 19, 2026",
    products: [
      {
        name: "Premium T-Shirt Oversized Cotton Casual Wear",
        image: "https://picsum.photos/300?1",
        price: 399,
        qty: 1,
        variant: "Size XL • Color Red",
      },
      {
        name: "Casual Cotton Hoodie",
        image: "https://picsum.photos/300?2",
        price: 599,
        qty: 2,
        variant: "Size Large • Color Gray",
      },
    ],
    total: 1597,
  },
  {
    id: "2",
    shop: "Tech Gadget Shop",
    status: "To Receive",
    date: "June 18, 2026",
    products: [
      {
        name: "Wireless Bluetooth Earbuds",
        image: "https://picsum.photos/300?3",
        price: 1299,
        qty: 1,
        variant: "",
      },
    ],
    total: 1299,
  },
  {
    id: "3",
    shop: "Beauty Store",
    status: "Completed",
    date: "June 10, 2026",
    products: [
      {
        name: "Skin Care Set",
        image: "https://picsum.photos/300?4",
        price: 799,
        qty: 1,
        variant: "",
      },
    ],
    total: 799,
  },
];

export default function OrderList() {
  const router = useRouter();

  // Extracts parameters passed during navigation routing actions
  const { status } = useLocalSearchParams<{ status?: string }>();

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [orders, setOrders] = useState(initialOrders);

  // Monitors search parameters to apply the correct active filter tab dynamically
  useEffect(() => {
    if (status && filters.includes(status)) {
      setSelectedFilter(status);
    }
  }, [status]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "All") {
      return orders;
    }
    return orders.filter((item) => item.status === selectedFilter);
  }, [selectedFilter, orders]);

  const cancelOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: "Cancelled" } : order,
      ),
    );
  };

  const refundOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: "Returned" } : order,
      ),
    );
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
          {filters.map((item) => {
            const isTabActive = selectedFilter === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setSelectedFilter(item)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  isTabActive
                    ? "bg-[#034194] border-[#034194]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text
                  className={`font-medium text-xs ${
                    isTabActive ? "text-white" : "text-slate-600"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* RENDER LIST COMPONENT */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: 100,
        }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl mb-4 p-4 border border-slate-200 shadow-sm">
            {/* SHOP HEADER */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Ionicons name="storefront-outline" size={18} color="#034194" />
                <Text className="ml-2 font-bold text-slate-800">
                  {item.shop}
                </Text>
              </View>
              <Text className="text-[#034194] font-semibold text-xs bg-blue-50 px-2 py-1 rounded-md">
                {item.status}
              </Text>
            </View>

            {/* PRODUCTS */}
            {item.products.map((product, index) => (
              <View key={`${product.name}-${index}`} className="flex-row mb-3">
                <Image
                  source={{ uri: product.image }}
                  style={{
                    width: 75,
                    height: 75,
                    borderRadius: 12,
                  }}
                />
                <View className="flex-1 ml-3 justify-between">
                  <View>
                    <Text
                      numberOfLines={2}
                      className="font-medium text-slate-800 text-sm"
                    >
                      {product.name}
                    </Text>
                    {product.variant !== "" && (
                      <Text className="text-[11px] text-slate-400 mt-0.5">
                        {product.variant}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-[#034194] font-bold">
                      ₱{product.price}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      x{product.qty}
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
              {item.status === "To Ship" && (
                <TouchableOpacity
                  onPress={() => cancelOrder(item.id)}
                  className="border border-red-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-red-500 text-xs font-semibold">
                    Cancel Order
                  </Text>
                </TouchableOpacity>
              )}

              {item.status === "Completed" && (
                <TouchableOpacity
                  onPress={() => refundOrder(item.id)}
                  className="border border-orange-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-orange-500 text-xs font-semibold">
                    Refund
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity className="bg-[#034194] px-4 py-2 rounded-xl">
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
            <Text className="text-slate-400 text-xs mt-1">
              There are no orders matching this selection status.
            </Text>
          </View>
        }
      />
    </View>
  );
}
