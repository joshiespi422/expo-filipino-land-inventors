import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
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

const products = [
  {
    id: "1",
    name: "Premium T-Shirt",
    price: "₱399",
    image: "https://picsum.photos/300?1",
    category: "Clothes",
  },
  {
    id: "2",
    name: "Running Shoes",
    price: "₱1,299",
    image: "https://picsum.photos/300?2",
    category: "Shoes",
  },
  {
    id: "3",
    name: "Bluetooth Speaker",
    price: "₱899",
    image: "https://picsum.photos/300?3",
    category: "Electronics",
  },
  {
    id: "4",
    name: "Lipstick",
    price: "₱199",
    image: "https://picsum.photos/300?4",
    category: "Beauty",
  },
  {
    id: "5",
    name: "Rice 5kg",
    price: "₱280",
    image: "https://picsum.photos/300?5",
    category: "Grocery",
  },
  {
    id: "6",
    name: "Leather Bag",
    price: "₱799",
    image: "https://picsum.photos/300?6",
    category: "Bags",
  },
  {
    id: "7",
    name: "Smart Watch",
    price: "₱1,999",
    image: "https://picsum.photos/300?7",
    category: "Electronics",
  },
  {
    id: "8",
    name: "Cap",
    price: "₱150",
    image: "https://picsum.photos/300?8",
    category: "Accessories",
  },
  {
    id: "9",
    name: "Sneakers",
    price: "₱1,499",
    image: "https://picsum.photos/300?9",
    category: "Shoes",
  },
  {
    id: "10",
    name: "Jacket",
    price: "₱899",
    image: "https://picsum.photos/300?10",
    category: "Clothes",
  },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const filteredProducts = products.filter((item) => {
    const categoryMatch =
      selectedCategory === "All" || item.category === selectedCategory;

    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="bg-white rounded-3xl border border-slate-100 mb-4 overflow-hidden"
      style={{
        width: "48%",
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={{
          width: "100%",
          height: 150,
        }}
      />

      <View className="p-3">
        <Text numberOfLines={1} className="font-semibold text-slate-800">
          {item.name}
        </Text>

        <Text className="text-primary font-bold text-lg mt-1">
          {item.price}
        </Text>

        <TouchableOpacity className="bg-primary mt-3 rounded-xl py-2">
          <Text className="text-center text-white font-semibold">
            Add to Cart
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View className="flex-row items-center mb-5">
              <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 h-14 border border-slate-200">
                <Ionicons name="search" size={22} color="#64748b" />

                <TextInput
                  placeholder="Search products..."
                  value={search}
                  onChangeText={setSearch}
                  className="flex-1 ml-3"
                />
              </View>

              <TouchableOpacity className="ml-3 bg-white h-14 w-14 rounded-2xl items-center justify-center border border-slate-200">
                <Ionicons name="cart-outline" size={24} color="#034194" />
              </TouchableOpacity>

              <TouchableOpacity className="ml-2 bg-white h-14 w-14 rounded-2xl items-center justify-center border border-slate-200">
                <Ionicons name="chatbubble-outline" size={24} color="#034194" />
              </TouchableOpacity>
            </View>

            {/* BANNER */}
            <View className="bg-[#E0EEFD] rounded-3xl p-5 mb-5">
              <Image
                source={image}
                className="!w-full !h-24 rounded-2xl"
                resizeMode="cover"
              />

              {/* CATEGORY */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-5"
              >
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setSelectedCategory(item)}
                    className="mr-3 px-3"
                  >
                    <Text
                      className={`font-medium ${
                        selectedCategory === item
                          ? "text-primary"
                          : "text-slate-600"
                      }`}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* TITLE */}
            <Text className="text-xl font-bold text-slate-800 mb-4">
              Featured Products
            </Text>

            {loading && (
              <View className="flex-row flex-wrap justify-between">
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} className="mb-4" style={{ width: "48%" }}>
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
