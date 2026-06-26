import {
  Address,
  CheckoutItem,
  CheckoutSummary,
  fetchCheckoutDetails,
  PaymentMethod,
  placeOrderAPI,
} from "@/services/checkout";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log("🔍 [CHECKOUT MOUNT/UPDATE] Raw Route Params:", params);

  const rawCartItemIds = params.cart_item_ids;

  // Compute the clean numeric array from route params
  const cartItemIds = useMemo<number[]>(() => {
    if (!rawCartItemIds) {
      console.log("⚠️ [PARSING] No rawCartItemIds found in parameters.");
      return [];
    }

    let parsed: number[] = [];
    if (Array.isArray(rawCartItemIds)) {
      parsed = rawCartItemIds.map(Number).filter(Boolean);
    } else {
      parsed = String(rawCartItemIds).split(",").map(Number).filter(Boolean);
    }

    console.log("✅ [PARSING] Successfully parsed Item IDs array:", parsed);
    return parsed;
  }, [rawCartItemIds]);

  // View Layout States
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dynamic Model Data Arrays
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [note, setNote] = useState<string>("");

  // ✅ FIXED: Rely on rawCartItemIds string primitive representation instead of array reference matching
  useEffect(() => {
    console.log(
      "🚀 [EFFECT TRIGGER] Checking cartItemIds length:",
      cartItemIds.length,
    );

    if (cartItemIds.length === 0) {
      console.log(
        "🛑 [EFFECT HALT] Blocking fetch, cartItemIds list is completely empty.",
      );
      Alert.alert("Error", "No items selected for checkout.", [
        { text: "Go Back", onPress: () => router.back() },
      ]);
      return;
    }

    const loadCheckoutData = async () => {
      try {
        console.log(
          "📡 [API REQUEST] Dispatching fetchCheckoutDetails with IDs:",
          cartItemIds,
        );
        setLoading(true);

        const response = await fetchCheckoutDetails(cartItemIds);
        console.log(
          "📥 [API RESPONSE] Success status:",
          response.success,
          "Full Response payload:",
          response,
        );

        if (response.success) {
          const data = response.data;
          setAddresses(data.addresses);
          setPaymentMethods(data.paymentMethods);
          setItems(data.items);
          setSummary(data.summary);

          // Auto select default address profile
          const defaultAddr =
            data.addresses.find((addr) => addr.is_default) || data.addresses[0];
          setSelectedAddress(defaultAddr || null);
          console.log(
            "🏠 [DATA BOUND] Automatically assigned address profile:",
            defaultAddr,
          );

          // Filter payment methods to find allowed target names safely ("cash on delivery", "pay online")
          const allowedMethods = data.paymentMethods.filter((method) => {
            const name = method.name.toLowerCase();
            return (
              name.includes("cash on delivery") || name.includes("pay online")
            );
          });

          // Auto select primary allowed payment method
          if (allowedMethods.length > 0) {
            setSelectedPaymentMethod(allowedMethods[0]);
            console.log(
              "💳 [DATA BOUND] Automatically assigned filtered payment profile:",
              allowedMethods[0],
            );
          } else if (data.paymentMethods.length > 0) {
            setSelectedPaymentMethod(data.paymentMethods[0]);
            console.log(
              "💳 [DATA BOUND] Fallback selection assigned:",
              data.paymentMethods[0],
            );
          }
        }
      } catch (error: any) {
        console.error(
          "❌ [API ERROR] Network breakdown or backend rejection:",
          error,
        );
        if (error?.response) {
          console.error("⚠️ [SERVER RESPONSE DATA]:", error.response.data);
          console.error("⚠️ [SERVER STATUS CODE]:", error.response.status);
        }

        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to load checkout details.",
        );
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [rawCartItemIds]); // ✅ Dependent on string representation to stop loop cycles

  // Group retrieved flat resources into explicit store headers layout blocks
  const groupedItems = useMemo(() => {
    const groups: {
      [key: string]: { seller: string; products: CheckoutItem[] };
    } = {};
    items.forEach((item) => {
      const storeName = item.product?.store?.name || "FISMPC Store";
      if (!groups[storeName]) {
        groups[storeName] = { seller: storeName, products: [] };
      }
      groups[storeName].products.push(item);
    });
    return Object.values(groups);
  }, [items]);

  const handlePlaceOrder = async () => {
    console.log("🔘 [SUBMIT CLICKED] Initializing validation assertions...");
    console.log("👉 Target Address:", selectedAddress);
    console.log("👉 Target Payment Method:", selectedPaymentMethod);

    if (!selectedAddress) {
      Alert.alert("Validation Error", "Please choose a delivery address.");
      return;
    }
    if (!selectedPaymentMethod) {
      Alert.alert("Validation Error", "Please select a payment method.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        address_id: selectedAddress.id,
        payment_method_id: selectedPaymentMethod.id,
        cart_item_ids: cartItemIds,
        note: note.trim() || undefined,
      };

      console.log("📤 [ORDER SUBMIT PAYLOAD]:", payload);

      const result = await placeOrderAPI(payload);
      console.log("📥 [ORDER SUBMIT RESPONSE]:", result);

      if (result.success) {
        Alert.alert("Success", result.message, [
          {
            text: "OK",
            onPress: () => router.replace("/order-list"),
          },
        ]);
      }
    } catch (error: any) {
      console.error("❌ [ORDER PLACEMENT REJECTION] System Crash:", error);
      if (error?.response) {
        console.error("⚠️ [SERVER FAILURE BLOB]:", error.response.data);
      }
      Alert.alert(
        "Order Failure",
        error?.response?.data?.message ||
          "Something went wrong parsing transaction components.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-100">
        <ActivityIndicator size="large" color="#034194" />
        <Text className="mt-3 text-slate-500 font-medium">
          Preparing checkout records...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, paddingBottom: 130 }}
      >
        {/* ADDRESS */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={24} color="#034194" />
              <Text className="ml-2 font-bold text-lg">Delivery Address</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Address Selection", "Feature coming soon.")
              }
            >
              <Text className="text-primary font-semibold">Change</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View className="mt-3">
              <Text className="font-semibold text-slate-800">
                {selectedAddress.recipient_name}
              </Text>
              <Text className="text-slate-500 my-0.5">
                {selectedAddress.recipient_number}
              </Text>
              <Text className="text-slate-500 text-sm leading-5">
                {selectedAddress.full_address}
              </Text>
              {selectedAddress.landmark && (
                <Text className="text-xs text-slate-400 mt-1 italic">
                  Landmark: {selectedAddress.landmark}
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-red-500 mt-3 font-medium">
              No address options configured.
            </Text>
          )}
        </View>

        {/* ITEMS */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold text-lg mb-3">Order Items</Text>

          {groupedItems.map((shop) => (
            <View key={shop.seller} className="mb-2">
              <View className="flex-row items-center mb-3">
                <Ionicons name="storefront-outline" size={20} color="#034194" />
                <Text className="ml-2 font-semibold text-slate-800">
                  {shop.seller}
                </Text>
              </View>

              {shop.products.map((item) => {
                const variantAttributes =
                  item.attributes
                    ?.map((attr) => `${attr.name}: ${attr.value}`)
                    .join(" • ") || "";

                return (
                  <View key={item.id} className="flex-row mb-4">
                    <Image
                      source={{
                        // ✨ Fallback path safely pointing to item.product.image
                        uri: `http://192.168.1.46:8000${item.product.image || ""}`,
                      }}
                      style={{ width: 75, height: 75, borderRadius: 12 }}
                    />

                    <View className="flex-1 ml-3 justify-between">
                      <Text
                        numberOfLines={2}
                        className="font-medium text-slate-800"
                      >
                        {item.product.name}
                      </Text>

                      {variantAttributes !== "" && (
                        <Text className="text-xs text-slate-500 mt-0.5">
                          {variantAttributes}
                        </Text>
                      )}

                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="font-bold text-primary text-base">
                          ₱{item.variant.price.toLocaleString()}
                        </Text>
                        <Text className="text-slate-500 font-medium">
                          x{item.quantity}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* PAYMENT METHODS */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold text-lg mb-3">Payment Method</Text>

          {paymentMethods
            // 👇 Filter array dynamically matching names only
            .filter((method) => {
              const name = method.name.toLowerCase();
              return (
                name.includes("cash on delivery") || name.includes("pay online")
              );
            })
            .map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedPaymentMethod(method)}
                className="flex-row items-center mb-3"
              >
                <Ionicons
                  name={
                    selectedPaymentMethod?.id === method.id
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color="#034194"
                />
                <Text className="ml-3 font-medium text-slate-700">
                  {method.name}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* MESSAGE */}
        <View className="bg-white rounded-2xl p-4 mb-3">
          <Text className="font-bold mb-2 text-slate-800">
            Message to Seller (Optional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add note for seller..."
            multiline
            className="bg-slate-100 rounded-xl px-4 py-3 text-slate-700"
            style={{ height: 90, textAlignVertical: "top" }}
          />
        </View>

        {/* SUMMARY */}
        {summary && (
          <View className="bg-white rounded-2xl p-4 mb-3">
            <Text className="font-bold text-lg mb-3">Order Summary</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500">Subtotal</Text>
              <Text className="text-slate-800 font-medium">
                ₱{summary.subtotal.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500">Discount</Text>
              <Text className="text-red-500 font-medium">
                -₱{summary.discount.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500">Estimated Shipping</Text>
              <Text className="text-slate-800 font-medium">
                ₱{summary.shipping_fee.toLocaleString()}
              </Text>
            </View>

            <View className="border-t border-slate-200 mt-3 pt-3 flex-row justify-between">
              <Text className="font-bold text-lg text-slate-800">
                Total Payment
              </Text>
              <Text className="font-bold text-primary text-lg">
                ₱{summary.total.toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER ACTION */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={submitting}
          className={`rounded-2xl py-4 items-center ${submitting ? "bg-slate-400" : "bg-primary"}`}
        >
          <Text className="text-white font-bold text-lg">
            {submitting
              ? "Processing Order..."
              : `Place Order ₱${summary?.total ? summary.total.toLocaleString() : "0"}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
