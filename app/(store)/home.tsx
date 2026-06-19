import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ProductCard } from "@/components/ProductItems";
import { products } from "@/services/productService";
import image from "../../assets/images/vector/FISMPC.png";

const categories = [
  "All",
  "Clothes",
  "Shoes",
  "Electronics",
  "Beauty",
  "Grocery",
  "Bags",
  "Accessories",
];

export default function HomePage() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 500);

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredProducts = products.filter((item) => {
    const categoryMatch =
      selectedCategory === "All" || item.category === selectedCategory;

    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());

    return categoryMatch && searchMatch;
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

  const handleChatPress = () => {
    router.push("/chat-list");
  };

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={loading ? [] : filteredProducts}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => handleProductPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: 7, paddingBottom: 20 }}
        ListHeaderComponent={
          <>
            {/* SEARCH + ACTIONS */}
            <View className="flex-row items-center mb-3">
              {/* Search */}
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

                {/* Badge */}
                <View className="absolute -top-1 -right-1 bg-[#D70127] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 z-10">
                  <Text className="text-white text-[10px] font-bold">3</Text>
                </View>
              </TouchableOpacity>

              {/* CHAT */}
              <TouchableOpacity
                onPress={handleChatPress}
                className="ml-2 bg-white h-14 w-14 rounded-2xl items-center justify-center border border-slate-200 relative"
              >
                <Ionicons name="chatbubble-outline" size={24} color="#034194" />

                {/* Badge */}
                <View className="absolute -top-1 -right-1 bg-[#D70127] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 z-10">
                  <Text className="text-white text-[10px] font-bold">3</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* BANNER */}
            <View className="bg-blue rounded-3xl p-3 mb-3">
              <Image
                source={image}
                className="!w-full !h-24 rounded-2xl"
                resizeMode="cover"
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
              >
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setSelectedCategory(item)}
                    className="mr-3 px-3"
                  >
                    <Text
                      className={
                        selectedCategory === item
                          ? "font-medium text-primary"
                          : "font-medium text-slate-600"
                      }
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* SKELETON */}
            {loading && (
              <View className="flex-row flex-wrap justify-between">
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} style={{ width: "48%" }} className="mb-4">
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
