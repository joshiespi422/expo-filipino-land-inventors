import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
  const [selectedFilter, setSelectedFilter] = useState("All");

  const [orders, setOrders] = useState(initialOrders);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === "All") {
      return orders;
    }

    return orders.filter((item) => item.status === selectedFilter);
  }, [selectedFilter, orders]);

  const cancelOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status: "Cancelled",
            }
          : order,
      ),
    );
  };

  const refundOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              status: "Returned",
            }
          : order,
      ),
    );
  };

  return (
    <View className="flex-1 bg-slate-100">
      {/* HEADER */}

      <View className="bg-white px-4 py-4">
        <Text className="font-bold text-xl">My Orders</Text>
      </View>

      {/* FILTER */}

      <View className="bg-white py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-3"
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setSelectedFilter(item)}
              className={`
mr-3 px-4 py-2 rounded-full
${selectedFilter === item ? "bg-primary" : "bg-slate-100"}
`}
            >
              <Text
                className={
                  selectedFilter === item
                    ? "text-white font-semibold"
                    : "text-slate-600"
                }
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 12,

          paddingBottom: 100,
        }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl mb-4 p-4">
            {/* SHOP HEADER */}

            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Ionicons name="storefront-outline" size={20} color="#034194" />

                <Text className="ml-2 font-semibold">{item.shop}</Text>
              </View>

              <Text className="text-primary font-semibold">{item.status}</Text>
            </View>

            {/* PRODUCTS */}

            {item.products.map((product) => (
              <View key={product.name} className="flex-row mb-3">
                <Image
                  source={{
                    uri: product.image,
                  }}
                  style={{
                    width: 80,

                    height: 80,

                    borderRadius: 12,
                  }}
                />

                <View className="flex-1 ml-3">
                  <Text numberOfLines={2} className="font-medium">
                    {product.name}
                  </Text>

                  {product.variant !== "" && (
                    <Text className="text-xs text-slate-500 mt-1">
                      {product.variant}
                    </Text>
                  )}

                  <View className="flex-row justify-between mt-2">
                    <Text className="text-primary font-bold">
                      ₱{product.price}
                    </Text>

                    <Text>x{product.qty}</Text>
                  </View>
                </View>
              </View>
            ))}

            <View className="border-t border-slate-200 pt-3 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-slate-500">Order Total</Text>

                <Text className="font-bold text-lg">₱{item.total}</Text>
              </View>
            </View>

            {/* ACTION BUTTONS */}

            <View className="flex-row justify-end mt-4 gap-2">
              {item.status === "To Ship" && (
                <TouchableOpacity
                  onPress={() => cancelOrder(item.id)}
                  className="border border-red-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-red-500">Cancel Order</Text>
                </TouchableOpacity>
              )}

              {item.status === "Completed" && (
                <TouchableOpacity
                  onPress={() => refundOrder(item.id)}
                  className="border border-orange-500 px-4 py-2 rounded-xl"
                >
                  <Text className="text-orange-500">Refund</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity className="bg-primary px-4 py-2 rounded-xl">
                <Text className="text-white">View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
