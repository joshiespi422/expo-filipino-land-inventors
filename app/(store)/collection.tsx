import { ProductCard } from "@/components/ProductItems";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CollectionProduct,
  getCollections,
  toggleCollection,
} from "@/services/productService";
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

export default function FavoritesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Strongly typed using your explicit CollectionProduct interface definition
  const [favoriteItems, setFavoriteItems] = useState<CollectionProduct[]>([]);

  // Fetches authentic collection datasets using your custom productService client
  const fetchCollections = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const response = await getCollections();

      if (
        response &&
        (response.status === "success" || (response as any).success === true)
      ) {
        // Filter out items that don't have a valid nested product object
        const activeCollections = response.collections.filter(
          (item) => item && item.product,
        );

        setFavoriteItems(activeCollections);
      }
    } catch (error) {
      console.error("Failed to load backend favorites data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger data loader on layout mounting cycle
  useEffect(() => {
    fetchCollections(true);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCollections(false);
  }, []);

  // Toggles heart off optimistically and updates the database record status
  const handleToggleFavorite = async (collectionId: number, slug: string) => {
    if (!slug) return;

    // Cache copy of item state context to enable rollbacks on connection errors
    const technicalFallbackItems = [...favoriteItems];

    // 1. Optimistic UI update: Remove immediately from list for zero visual latency
    setFavoriteItems((prevItems) =>
      prevItems.filter(
        (item) => item.id !== collectionId && item.product?.slug !== slug,
      ),
    );

    try {
      // 2. Transmit toggle packet down through network layer boundaries
      await toggleCollection(slug);
    } catch (error) {
      console.error(
        "Failed to persist layout favorite selection toggles:",
        error,
      );
      // Rollback optimistic state changes instantly if backend exception rules trigger
      setFavoriteItems(technicalFallbackItems);
    }
  };

  const handleProductPress = (slug: string) => {
    if (!slug) return;
    router.push({
      pathname: "/products/[slug]",
      params: { slug },
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
            {loading ? "..." : favoriteItems.length}
          </Text>
        </View>

        {/* Action button commonly found on Shopee headers */}
        <TouchableOpacity onPress={handleCartPress} className="p-2 relative">
          <Ionicons name="cart-outline" size={24} color="#034194" />
          <View className="absolute top-1 right-1 bg-[#D70127] rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 z-10">
            <Text className="text-white text-[9px] font-bold">3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* PRODUCTS GRID */}
      <FlatList
        data={loading ? [] : favoriteItems}
        renderItem={({ item }) => {
          const product = item.product;

          if (!product) return null;

          // 1. Direct alignment mapping from ProductCardResource output payload fields
          const productPrice = Number(product.price ?? 0);

          // 2. SOLD COUNT CHECK
          const productSold = Number(product.sold_count ?? 0);

          // 3. RATING CHECK
          const productRating =
            product.rating !== null && product.rating !== undefined
              ? Number(product.rating)
              : 5;

          // 4. MATCHING STOCK
          const productStock = Number(product.stock ?? 0);

          // 5. MATCHING THE IMAGE FIELD RESOLVED BY THE RESOURCE
          const productImage = product.image ?? "";

          return (
            <ProductCard
              item={{
                id: product.id.toString(),
                name: product.name,
                price:
                  productPrice > 0
                    ? `₱${productPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "₱0.00",
                image: productImage,
                sold_count: `${productSold} sold`,
                rating: productRating,
                stock: productStock,
                category: "",
                isLiked: true,
              }}
              onPress={() => handleProductPress(product.slug)}
              onFavoritePress={() =>
                handleToggleFavorite(item.id, product.slug)
              }
            />
          );
        }}
        keyExtractor={(item, index) =>
          item.id ? item.id.toString() : `fav-${item.product_id}-${index}`
        }
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 4,
        }}
        contentContainerStyle={{ padding: 4, paddingBottom: 20 }}
        ListHeaderComponent={
          <>
            {/* SKELETON LOADING STATE */}
            {loading && (
              <View className="flex-row flex-wrap justify-between pt-2 px-1">
                {[1, 2, 3, 4].map((skeletonId) => (
                  <View
                    key={skeletonId}
                    style={{ width: "48%" }}
                    className="mb-4"
                  >
                    <Skeleton className="h-[220px] rounded-3xl" />
                  </View>
                ))}
              </View>
            )}

            {/* EMPTY STATE */}
            {!loading && favoriteItems.length === 0 && (
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
