import { ProductCard } from "@/components/ProductItems";
import { Skeleton } from "@/components/ui/skeleton";
import { Category, getStoreHome, Product } from "@/services/productService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import image from "../../assets/images/vector/FISMPC.png";

export default function HomePage() {
  const router = useRouter();

  // Track state using the dynamic IDs/Strings
  const [selectedCategory, setSelectedCategory] = useState<string | number>(
    "All",
  );

  const [search, setSearch] = useState("");

  // --- SMOOTH ANIMATION CONFIGURATION ---
  const scrollX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1);
  // --------------------------------------

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // State managed from DB fetch results
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [topDeals, setTopDeals] = useState<Product[]>([]);

  // Accepts target category parameter overrides and current page context
  const fetchProducts = async (
    catId: string | number = "All",
    targetPage = 1,
    isInitialLoad = true,
  ) => {
    if (isInitialLoad && targetPage === 1) {
      setLoading(true);
    } else if (targetPage > 1) {
      setLoadingMore(true);
    }

    try {
      // Ensure your getStoreHome service signature accepts a secondary numeric page parameter
      const response = await getStoreHome(catId, targetPage);

      console.log("STORE RESPONSE:", response);

      // Inject default fallback "All" into the array returned by database on initial load
      if (targetPage === 1 && response?.data?.categories) {
        setCategories([
          { id: "All", name: "All", slug: "all" },
          ...response.data.categories,
        ]);
      }

      if (targetPage === 1) {
        setTopDeals(response?.data?.productsTopDeals ?? []);
        setProducts(response?.data?.productsDiscover ?? []);
      } else {
        // Append next chunk of items to existing state arrays
        setProducts((prev) => [
          ...prev,
          ...(response?.data?.productsDiscover ?? []),
        ]);
      }

      // Track backend pagination configuration structures
      const pagination = response?.data?.pagination;
      if (pagination) {
        setPage(pagination.current_page);
        setHasMore(pagination.has_more);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      console.log("Failed to load products:", error?.response?.data ?? error);
      if (targetPage === 1) {
        setProducts([]);
        setTopDeals([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts("All", 1, true);
  }, []);

  // Reset page iteration and overwrite active product maps on categorical variations
  const handleCategoryPress = (catId: string | number) => {
    setSelectedCategory(catId);
    setPage(1);
    fetchProducts(catId, 1, true);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(selectedCategory, 1, false);
  }, [selectedCategory]);

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      fetchProducts(selectedCategory, nextPage, false);
    }
  };

  const filteredProducts = (products ?? []).filter((item) => {
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  });

  const handleProductPress = (id: string | number) => {
    router.push({
      pathname: "/products",
      params: {
        id: id.toString(),
      },
    });
  };

  const handleCartPress = () => {
    router.push("/cart");
  };

  const handleChatPress = () => {
    router.push("/chat-list");
  };

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={loading ? [] : filteredProducts}
        renderItem={({ item }) => (
          <ProductCard
            item={{
              id: item.id.toString(),
              name: item.name,
              price: item.price
                ? `₱${Number(item.price).toLocaleString()}`
                : "₱0",
              image: item.image ?? "",
              sold: `${item.stock} stocks`,
              rating: "5.0",
              location: "FISMPC Store",
              category: "",
            }}
            onPress={() => handleProductPress(item.id)}
          />
        )}
        keyExtractor={(item, index) => `${item.id.toString()}-${index}`}
        numColumns={2}
        columnWrapperStyle={
          filteredProducts.length > 0
            ? { justifyContent: "space-between" }
            : undefined
        }
        contentContainerStyle={{
          padding: 7,
          paddingBottom: 20,
        }}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-12 px-4">
              <Ionicons name="basket-outline" size={64} color="#94a3b8" />
              <Text className="text-slate-700 text-base font-semibold mt-4 text-center">
                No Products Found
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                We couldn&apos;t find anything matching your selection or search
                criteria.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center justify-center">
              <ActivityIndicator size="small" color="#034194" />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <>
            {/* SEARCH */}
            <View className="flex-row items-center mb-3">
              <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 h-14 border border-slate-200">
                <Ionicons name="search" size={22} color="#64748b" />
                <TextInput
                  placeholder="Search products.."
                  value={search}
                  onChangeText={setSearch}
                  className="flex-1 ml-3"
                />
              </View>

              {/* CART */}
              <TouchableOpacity
                onPress={handleCartPress}
                className="ml-3 bg-white h-14 w-14 rounded-2xl items-center justify-center border border-slate-200 relative"
              >
                <Ionicons name="cart-outline" size={24} color="#034194" />
                <View className="absolute -top-1 -right-1 bg-[#D70127] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">3</Text>
                </View>
              </TouchableOpacity>

              {/* CHAT */}
              <TouchableOpacity
                onPress={handleChatPress}
                className="ml-2 bg-white h-14 w-14 rounded-2xl items-center justify-center border border-slate-200 relative"
              >
                <Ionicons name="chatbubble-outline" size={24} color="#034194" />
                <View className="absolute -top-1 -right-1 bg-[#D70127] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">3</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* BANNER & DYNAMIC CATEGORIES NAVBAR */}
            <View className="bg-blue rounded-3xl p-3 mb-3">
              <Image
                source={image}
                className="!w-full !h-24 rounded-2xl"
                resizeMode="cover"
              />

              {/* CATEGORY SLIDER */}
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
                scrollEventThrottle={1} // Captured at maximum resolution for extreme smoothness
                onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
                onContentSizeChange={(w) => setContentWidth(w)}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }, // Offloads calculations directly to OS user interface layer
                )}
              >
                {categories.map((item, index) => (
                  <TouchableOpacity
                    key={item.id.toString()}
                    onPress={() => handleCategoryPress(item.id)}
                    className="mr-3 px-2 rounded-full"
                  >
                    <Text
                      className={
                        selectedCategory === item.id
                          ? "font-semibold text-primary"
                          : "font-medium text-slate-600"
                      }
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.ScrollView>

              {/* SLIDE BAR INDICATOR */}
              <View className="items-center mt-3">
                {(() => {
                  const totalCategories = Math.max(categories.length, 1);
                  const trackWidth = Math.min(
                    Math.max(totalCategories * 16, 48),
                    120,
                  );
                  const thumbWidth = trackWidth / totalCategories;
                  const maxScrollDistance = trackWidth - thumbWidth;

                  return (
                    <View
                      style={{ width: trackWidth }}
                      className="h-2 bg-primary border border-primary rounded-full overflow-hidden"
                    >
                      <Animated.View
                        className="h-full bg-white rounded-full"
                        style={{
                          width: `${100 / totalCategories}%`,
                          transform: [
                            {
                              translateX: scrollX.interpolate({
                                inputRange: [
                                  0,
                                  Math.max(contentWidth - containerWidth, 1),
                                ],
                                outputRange: [0, maxScrollDistance],
                                extrapolate: "clamp",
                              }),
                            },
                          ],
                        }}
                      />
                    </View>
                  );
                })()}
              </View>
            </View>

            {/* TOP DEALS */}
            {!loading && topDeals.length > 0 && (
              <View className="mb-5 mt-2">
                <View className="flex-row justify-between items-center px-2 mb-2">
                  <Text className="text-lg font-bold text-primary">
                    Top Deals
                  </Text>
                  <Text className="text-sm text-primary font-medium underline">
                    View All
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    gap: 12,
                  }}
                >
                  {topDeals.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm w-44"
                      onPress={() => handleProductPress(item.id)}
                    >
                      <View className="relative">
                        <Image
                          source={{
                            uri: item.image ?? "",
                          }}
                          className="w-full h-36"
                          resizeMode="cover"
                        />
                        <View className="absolute top-2 left-2 bg-[#D70127] px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            DEAL
                          </Text>
                        </View>
                      </View>

                      <View className="p-3">
                        <Text
                          numberOfLines={2}
                          className="text-sm font-semibold text-slate-800"
                        >
                          {item.name}
                        </Text>

                        <View className="flex-row items-center mt-2">
                          <Text className="text-primary font-bold text-base">
                            ₱{Number(item.price).toLocaleString()}
                          </Text>
                          <Text className="text-xs text-slate-400 line-through ml-2">
                            ₱{(Number(item.price ?? 0) + 100).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className="text-lg font-bold text-primary ps-2 mb-1">
              Discover
            </Text>

            {/* SKELETON CARDS LOADING */}
            {loading && (
              <View className="flex-row flex-wrap justify-between">
                {[1, 2, 3, 4].map((item) => (
                  <View
                    key={item}
                    style={{
                      width: "48%",
                    }}
                    className="mb-4"
                  >
                    <Skeleton className="h-[220px] rounded-3xl" />
                  </View>
                ))}
              </View>
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#034194"]}
            tintColor="#034194"
          />
        }
      />
    </View>
  );
}
