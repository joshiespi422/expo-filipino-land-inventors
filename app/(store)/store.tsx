import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";

import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ProductCard } from "@/components/ProductItems";
import { products } from "@/services/productService";

import UserProfile from "../../assets/images/UserProfile.jpg";

export default function Store() {
  const router = useRouter();

  const { seller } = useLocalSearchParams();

  const [search, setSearch] = useState("");

  const [follow, setFollow] = useState(false);

  const storeName = seller || "Fashion Store";

  const storeProducts = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleProductPress = (id: string) => {
    router.push({
      pathname: "/products",

      params: {
        id,
      },
    });
  };

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={storeProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{
          justifyContent: "space-between",
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
                  source={UserProfile}
                  style={{
                    width: 75,

                    height: 75,

                    borderRadius: 50,
                  }}
                />

                <View className="ml-4 flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-primary text-2xl font-bold">
                      {storeName}
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

              {/* SHOP INFO */}

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

            {/* PRODUCTS TITLE */}

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
              ...item,

              image: item.image,
            }}
            onPress={() => handleProductPress(item.id)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Text className="text-slate-400">No products found</Text>
          </View>
        }
      />
    </View>
  );
}
