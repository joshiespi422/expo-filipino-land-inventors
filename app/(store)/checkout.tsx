import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const orderItems = [
  {
    seller: "Fashion Store",
    products: [
      {
        id: "1",
        name: "Premium T-Shirt Oversized Cotton Casual Wear",
        image: "https://picsum.photos/300?1",
        price: 399,
        originalPrice: 599,
        quantity: 1,
        variant: "Size: XL • Color: Red",
      },
      {
        id: "2",
        name: "Casual Cotton Hoodie",
        image: "https://picsum.photos/300?2",
        price: 599,
        originalPrice: 799,
        quantity: 2,
        variant: "Size: Large • Color: Gray",
      },
    ],
  },

  {
    seller: "Tech Gadget Shop",
    products: [
      {
        id: "3",
        name: "Wireless Bluetooth Earbuds",
        image: "https://picsum.photos/300?3",
        price: 1299,
        originalPrice: 1299,
        quantity: 1,
        variant: "",
      },
    ],
  },
];

export default function Checkout() {
  const router = useRouter();

  const [payment, setPayment] = useState("COD");

  const [message, setMessage] = useState("");

  const subtotal = orderItems.reduce(
    (total, shop) =>
      total +
      shop.products.reduce(
        (sum, item) => sum + item.originalPrice * item.quantity,
        0,
      ),
    0,
  );

  const discountTotal = orderItems.reduce(
    (total, shop) =>
      total +
      shop.products.reduce(
        (sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
        0,
      ),
    0,
  );

  const itemTotal = orderItems.reduce(
    (total, shop) =>
      total +
      shop.products.reduce((sum, item) => sum + item.price * item.quantity, 0),
    0,
  );

  const shipping = 50;

  const totalPayment = itemTotal + shipping;

  const paymentMethods = ["Online Payment", "COD", "Wallet"];

  const placeOrder = () => {
    console.log({
      items: orderItems,
      payment,
      message,
      totalPayment,
    });

    // after success
    router.push("/order-list");
  };

  return (
    <View className="flex-1 bg-slate-100">
      {/* HEADER */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: 130,
        }}
      >
        {/* ADDRESS */}

        <View className="bg-white rounded-2xl p-4 mb-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={24} color="#034194" />

              <Text className="ml-2 font-bold text-lg">Delivery Address</Text>
            </View>

            <TouchableOpacity>
              <Text className="text-primary">Change</Text>
            </TouchableOpacity>
          </View>

          <Text className="font-semibold mt-4">Joshua Payumo</Text>

          <Text className="text-slate-500">0912 345 6789</Text>

          <Text className="text-slate-500">
            Las Piñas City, Metro Manila, Philippines
          </Text>
        </View>

        {/* ITEMS */}

        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold text-lg mb-3">Order Items</Text>

          {orderItems.map((shop) => (
            <View key={shop.seller}>
              <View className="flex-row items-center mb-3">
                <Ionicons name="storefront-outline" size={20} color="#034194" />

                <Text className="ml-2 font-semibold">{shop.seller}</Text>
              </View>

              {shop.products.map((item) => (
                <View key={item.id} className="flex-row mb-4">
                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={{
                      width: 75,
                      height: 75,
                      borderRadius: 12,
                    }}
                  />

                  <View className="flex-1 ml-3">
                    <Text numberOfLines={2} className="font-medium">
                      {item.name}
                    </Text>

                    {item.variant !== "" && (
                      <Text className="text-xs text-slate-500 mt-1">
                        {item.variant}
                      </Text>
                    )}

                    <View className="flex-row items-center mt-2">
                      <Text className="text-slate-400 line-through text-xs mr-2">
                        ₱{item.originalPrice}
                      </Text>

                      <Text className="font-bold text-primary">
                        ₱{item.price}
                      </Text>

                      <Text className="ml-2 text-slate-500">
                        x{item.quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* PAYMENT */}

        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold text-lg mb-3">Payment Method</Text>

          {paymentMethods.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setPayment(item)}
              className="flex-row items-center mb-3"
            >
              <Ionicons
                name={payment === item ? "radio-button-on" : "radio-button-off"}
                size={22}
                color="#034194"
              />

              <Text className="ml-3">{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* MESSAGE */}

        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold mb-2">Message to Seller (Optional)</Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Add note for seller..."
            multiline
            className="bg-slate-100 rounded-xl px-4 py-3"
            style={{
              height: 90,
            }}
          />
        </View>

        {/* SUMMARY */}

        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold text-lg mb-3">Order Summary</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-500">Subtotal</Text>

            <Text>₱{subtotal.toLocaleString()}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-500">Discount</Text>

            <Text className="text-red-500">
              -₱{discountTotal.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-500">Estimated Shipping</Text>

            <Text>₱{shipping}</Text>
          </View>

          <View className="border-t border-slate-200 mt-3 pt-3 flex-row justify-between">
            <Text className="font-bold text-lg">Total Payment</Text>

            <Text className="font-bold text-primary text-lg">
              ₱{totalPayment.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4">
        <TouchableOpacity
          onPress={placeOrder}
          className="bg-primary rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-lg">
            Place Order ₱{totalPayment.toLocaleString()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
