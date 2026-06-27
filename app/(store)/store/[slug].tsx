import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ProductCard } from "@/components/ProductItems";
import {
  getStore,
  ShopDetails,
  ShopPagination,
  ShopProduct,
} from "@/services/shop";

import UserProfile from "../../../assets/images/UserProfile.jpg";

export default function Store() {
  const router = useRouter();

  // Extract slug from the dynamic route configuration /store/[slug]
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // State management for API integrations
  const [storeDetails, setStoreDetails] = useState<ShopDetails | null>(null);
  const [storeProducts, setStoreProducts] = useState<ShopProduct[]>([]);
  const [pagination, setPagination] = useState<ShopPagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState("");
  const [follow, setFollow] = useState(false);

  // Safely grab string value if parameter parses back as an array
  const storeSlug = Array.isArray(slug) ? slug[0] : slug || "";

  // Fetch store data dynamically from API backend
  useEffect(() => {
    // Prevent fetching if slug is empty, undefined, or still a placeholder
    if (!storeSlug || storeSlug === "undefined" || storeSlug === "[slug]") {
      setLoading(false);
      return;
    }

    const fetchStoreData = async () => {
      try {
        setLoading(true);

        // DEBUG LOG: Check your terminal to see exactly what slug value is passed
        console.log(`📡 Fetching store data for slug: "${storeSlug}"`);

        const response = await getStore(storeSlug, 1);

        if (response && response.success && response.data) {
          setStoreDetails(response.data.store);
          setStoreProducts(response.data.products);
          setPagination(response.data.pagination);
        } else {
          // Handle cases where response status is 200 but success flag is false
          setStoreDetails(null);
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch store data from backend:");
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Config URL: ${error.response.config.url}`);
          console.error("Data:", error.response.data);
        } else {
          console.error(error);
        }
        setStoreDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [storeSlug]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0052cc" />
        <Text className="mt-4 text-slate-500 font-medium">
          Loading store...
        </Text>
      </View>
    );
  }

  if (!storeDetails) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#D70127" />
        <Text className="text-xl font-semibold text-slate-800 mt-4 text-center">
          Store Not Found
        </Text>
        <Text className="text-slate-500 text-sm mt-2 text-center">
          The store with slug {storeSlug} could not be retrieved.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter products locally if searching
  const filteredProducts = storeProducts.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 8,
        }}
        contentContainerStyle={{
          padding: 8,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <>
            {/* SEARCH BAR */}
            <View className="flex-row mb-4">
              <View className="flex-1 h-14 bg-white rounded-2xl border border-slate-200 flex-row items-center px-4">
                <Ionicons name="search" size={22} color="#64748b" />
                <TextInput
                  placeholder="Search in this store..."
                  value={search}
                  onChangeText={setSearch}
                  className="flex-1 ml-3"
                />
              </View>

              <TouchableOpacity
                onPress={() => router.push("/cart")}
                className="ml-3 bg-white h-14 w-14 rounded-2xl items-center justify-center border border-slate-200"
              >
                <Ionicons name="cart-outline" size={25} color="#034194" />
              </TouchableOpacity>
            </View>

            {/* SHOP HEADER */}
            <View className="bg-white rounded-3xl p-5 mb-4 border border-slate-200">
              <View className="flex-row items-center">
                <Image
                  source={
                    storeDetails.logo ? { uri: storeDetails.logo } : UserProfile
                  }
                  style={{
                    width: 75,
                    height: 75,
                    borderRadius: 50,
                  }}
                />

                <View className="ml-4 flex-1">
                  <View className="flex-row items-center">
                    <Text
                      className="text-primary text-2xl font-bold"
                      numberOfLines={1}
                    >
                      {storeDetails.name || "Fashion Store"}
                    </Text>

                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#034194"
                      style={{
                        marginLeft: 5,
                      }}
                    />
                  </View>

                  <Text className="text-slate-500">Las Piñas City</Text>

                  <Text className="text-slate-400 text-sm mt-1">
                    Online now
                  </Text>
                </View>
              </View>

              {/* FOLLOW + CHAT BUTTON */}
              <View className="flex-row mt-5 gap-3">
                <TouchableOpacity
                  onPress={() => setFollow(!follow)}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    follow
                      ? "bg-primary border-primary"
                      : "bg-white border-primary"
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      follow ? "text-white" : "text-primary"
                    }`}
                  >
                    {follow ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/chat-seller")}
                  className="flex-1 py-3 bg-green-500 rounded-xl flex-row justify-center items-center"
                >
                  <Ionicons name="chatbubble" size={18} color="white" />
                  <Text className="text-white font-bold ml-2">Chat</Text>
                </TouchableOpacity>
              </View>

              {/* SHOP INFO / METRICS BLOCK */}
              <View className="flex-row justify-between mt-6">
                <View>
                  <Text className="font-bold text-center text-lg">4.9 ⭐</Text>
                  <Text className="text-slate-500">Rating</Text>
                </View>

                <View>
                  <Text className="font-bold text-center text-lg">
                    {storeProducts.length}
                  </Text>
                  <Text className="text-slate-500">Products</Text>
                </View>

                <View>
                  <Text className="font-bold text-center text-lg">10.5K</Text>
                  <Text className="text-slate-500">Followers</Text>
                </View>

                <View>
                  <Text className="font-bold text-center text-lg">98</Text>
                  <Text className="text-slate-500">Following</Text>
                </View>
              </View>
            </View>

            {/* PRODUCTS TITLE CONTAINER */}
            <View className="bg-blue rounded-xl py-3 mb-4">
              <Text className="text-primary text-center text-xl font-bold">
                Products
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <ProductCard
            item={{
              id: item.id.toString(),
              name: item.name,
              price: item.price
                ? `₱${Number(item.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "₱0.00",
              image: item.image ?? "",
              sold: `${item.stock ?? 0} stocks`,
              rating: "5.0",
              location: storeDetails.name || "Las Piñas City",
              category: "",
            }}
            onPress={() =>
              router.push({
                pathname: "/products/[slug]",
                params: { slug: item.slug },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-12 px-4">
            <Ionicons name="cube-outline" size={48} color="#94a3b8" />
            <Text className="text-slate-400 mt-2 text-center">
              No products found in this store.
            </Text>
          </View>
        }
      />
    </View>
  );
}
