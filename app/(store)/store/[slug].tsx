import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
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
} from "@/services/productService"; // Updated reference to pull from service file directly

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
    if (!storeSlug || storeSlug === "undefined" || storeSlug === "[slug]") {
      setLoading(false);
      return;
    }

    const fetchStoreData = async () => {
      try {
        setLoading(true);
        console.log(`📡 Fetching store data for slug: "${storeSlug}"`);

        const response = await getStore(storeSlug, 1);

        if (response && response.success && response.data) {
          setStoreDetails(response.data.store);
          setStoreProducts(response.data.products || []);
          setPagination(response.data.pagination);
        } else {
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
          The store with slug <Text className="font-bold">{storeSlug}</Text>{" "}
          could not be retrieved.
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
          paddingHorizontal: 0,
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

            {/* SHOP HEADER */}
            <ImageBackground
              source={
                storeDetails.banner ? { uri: storeDetails.banner } : { uri: "" }
              }
              resizeMode="cover"
              className={`rounded-3xl mb-4 overflow-hidden border border-slate-200 ${
                storeDetails.banner ? "bg-transparent" : "bg-white"
              }`}
            >
              {/* BLACK OPACITY LAYER - Only shows if there is a banner image */}
              {storeDetails.banner && (
                <View className="absolute inset-0 bg-black/50" />
              )}

              {/* MAIN CONTENT CONTAINER */}
              <View className="p-5">
                <View className="flex-row items-center">
                  <Image
                    source={
                      storeDetails.logo
                        ? { uri: storeDetails.logo }
                        : UserProfile
                    }
                    style={{
                      width: 75,
                      height: 75,
                      borderRadius: 37.5,
                      backgroundColor: "#f1f5f9",
                    }}
                    className="border border-slate-200"
                  />

                  <View className="ml-4 flex-1">
                    <View className="flex-row items-center flex-wrap">
                      <Text
                        className={`text-2xl font-bold mr-1 ${
                          storeDetails.banner ? "text-white" : "text-primary"
                        }`}
                        numberOfLines={1}
                      >
                        {storeDetails.name || "Fashion Store"}
                      </Text>

                      {storeDetails.is_official && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={storeDetails.banner ? "#38bdf8" : "#034194"}
                        />
                      )}
                    </View>

                    <Text
                      className={`text-xs mt-1 ${
                        storeDetails.banner
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                      numberOfLines={2}
                    >
                      {storeDetails.description || "Welcome to our store!"}
                    </Text>

                    {/* <Text
                      className={`text-xs mt-1 font-medium ${
                        storeDetails.banner
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      Online now
                    </Text> */}
                  </View>
                </View>

                {/* FOLLOW + CHAT BUTTON */}
                <View className="flex-row mt-5 gap-3">
                  <TouchableOpacity
                    onPress={() => setFollow(!follow)}
                    className={`flex-1 py-3 rounded-xl items-center border ${
                      storeDetails.banner
                        ? follow
                          ? "bg-white border-white"
                          : "bg-transparent border-white"
                        : follow
                          ? "bg-primary border-primary"
                          : "bg-white border-primary"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        storeDetails.banner
                          ? follow
                            ? "text-slate-900"
                            : "text-white"
                          : follow
                            ? "text-white"
                            : "text-primary"
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
                <View
                  className={`flex-row justify-between mt-6 pt-4 border-t ${
                    storeDetails.banner ? "border-white" : "border-slate-200"
                  }`}
                >
                  <View className="items-center flex-1">
                    <Text
                      className={`font-bold text-center text-lg ${
                        storeDetails.banner ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {storeDetails.rating
                        ? `${Number(storeDetails.rating).toFixed(1)} ⭐`
                        : "—"}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        storeDetails.banner
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Rating
                    </Text>
                  </View>

                  <View
                    className={`items-center flex-1 border-x ${
                      storeDetails.banner ? "border-white" : "border-slate-200"
                    }`}
                  >
                    <Text
                      className={`font-bold text-center text-lg ${
                        storeDetails.banner ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {pagination?.total !== undefined
                        ? pagination.total
                        : storeProducts.length}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        storeDetails.banner
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Products
                    </Text>
                  </View>

                  <View className="items-center flex-1">
                    <Text
                      className={`font-bold text-center text-lg ${
                        storeDetails.banner ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Active
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        storeDetails.banner
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      Status
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>

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
                ? `₱${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "₱0.00",
              image: item.image ?? "",
              sold_count: `${item.sold_count ?? 0} sold`,
              rating: item.rating,
              stock: item.stock,
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
