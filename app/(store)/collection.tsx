import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Product, ProductCard } from "@/components/ProductItems";
import { products } from "@/services/productService";

// Shopee-style sub-tabs for liked items
const favoriteTabs = ["All Items", "On Sale", "Available", "Out of Stock"];

export default function FavoritesPage() {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState("All Items");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Local state to hold our working favorites array list
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);

  // Initialize and automatically make every product heart red on mount
  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      // Map through your static service array and force isLiked to true initially
      const initializedFavorites = products.map((item) => ({
        ...item,
        isLiked: true,
      }));

      setFavoriteItems(initializedFavorites);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset back to base array layout with red hearts on pull-to-refresh
    const refreshedFavorites = products.map((item) => ({
      ...item,
      isLiked: true,
    }));
    setFavoriteItems(refreshedFavorites);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Toggles heart off, which automatically removes it from the filtered list below
  const handleToggleFavorite = useCallback((id: string) => {
    setFavoriteItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isLiked: !item.isLiked } : item,
      ),
    );
  }, []);

  // Filter listings based on tab index AND whether they are still hearted (isLiked === true)
  const likedProducts = favoriteItems.filter((item) => {
    // Only show items that are explicitly liked
    if (!item.isLiked) return false;

    if (selectedTab === "On Sale") return !!item.isOnSale;
    if (selectedTab === "Out of Stock") return item.quantity === 0;
    if (selectedTab === "Available")
      return item.quantity ? item.quantity > 0 : true;

    return true;
  });

  const handleProductPress = (id: string) => {
    router.push({
      pathname: "/products",
      params: { id },
    });
  };

  const handleCartPress = () => {
    router.push("/cart");
  };

  return (
    <View className="flex-1 bg-slate-100">
      {/* SHOPEE STYLE TOP FIXED HEADER */}
      <View className="bg-white pt-3 pb-1 px-4 flex-row items-center justify-between border-b border-slate-200">
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-slate-800">My Favorites</Text>
          <Text className="text-xs text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
            {loading ? "..." : likedProducts.length}
          </Text>
        </View>

        {/* Action button commonly found on Shopee headers */}
        <TouchableOpacity onPress={handleCartPress} className="p-2 relative">
          <Ionicons name="cart-outline" size={24} color="#64748b" />
          <View className="absolute top-1 right-1 bg-[#D70127] rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 z-10">
            <Text className="text-white text-[9px] font-bold">3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL FILTER TABS (Directly under header) */}
      <View className="bg-white border-b border-slate-200">
        <FlatList
          horizontal
          data={favoriteTabs}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const isActive = selectedTab === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedTab(item)}
                className={`mr-2 px-4 py-2 rounded-full border ${
                  isActive
                    ? "bg-[#034194] border-[#034194]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text
                  className={`font-medium text-xs ${
                    isActive ? "text-white" : "text-slate-600"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* PRODUCTS LIST */}
      <FlatList
        data={loading ? [] : likedProducts}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => handleProductPress(item.id)}
            onFavoritePress={() => handleToggleFavorite(item.id)} // Activates heart features inside this collection screen
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
        ListHeaderComponent={
          <>
            {/* SKELETON LOADING STATE */}
            {loading && (
              <View className="flex-row flex-wrap justify-between pt-2">
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} style={{ width: "48%" }} className="mb-4">
                    <Skeleton className="h-[220px] rounded-3xl" />
                  </View>
                ))}
              </View>
            )}

            {/* EMPTY STATE (If they haven't liked anything or filters are empty) */}
            {!loading && likedProducts.length === 0 && (
              <View className="items-center justify-center py-20">
                <View className="bg-slate-200 p-4 rounded-full mb-3">
                  <Ionicons
                    name="heart-dislike-outline"
                    size={40}
                    color="#94a3b8"
                  />
                </View>
                <Text className="text-slate-500 font-semibold text-base">
                  No items here yet
                </Text>
                <Text className="text-slate-400 text-xs text-center px-8 mt-1">
                  Tap the heart icon on product cards while browsing to save
                  them here!
                </Text>
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
