import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

// Product Data Contract Type
export interface Product {
  id: string;
  image: string;
  name: string;
  price: string | number;
  sold: string | number;
  rating: string | number;
  location: string;
  category: string;
  isLiked?: boolean; // Controls whether the heart is filled or outline
  isOnSale?: boolean; // Used by collection filters
  quantity?: number; // Used by collection availability status
}

interface ProductCardProps {
  item: Product;
  onPress: () => void;
  onFavoritePress?: () => void; // Optional: Displays the interactive heart toggle when passed
}

// Cleaned up typing pattern directly on parameters to satisfy the TS compiler safely
export const ProductCard = React.memo(
  ({ item, onPress, onFavoritePress }: ProductCardProps) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className="bg-white rounded-2xl p-2 border border-slate-100 mb-2 shadow overflow-hidden relative"
        style={{
          width: "49%",
        }}
      >
        {/* Product Image */}
        <Image
          source={{
            uri: item.image,
          }}
          className="rounded-xl"
          style={{
            width: "100%",
            height: 150,
          }}
        />

        {/* Absolute Heart Toggle Button Layer */}
        {onFavoritePress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation(); // Prevents clicking the heart from triggering the card's navigation
              onFavoritePress();
            }}
            className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-sm backdrop-blur-md z-10"
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={18}
              color={item.isLiked ? "#D70127" : "#64748b"}
            />
          </TouchableOpacity>
        )}

        <View className="py-3">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="font-semibold text-slate-800"
          >
            {item.name}
          </Text>

          <Text className="text-primary font-bold text-lg mt-1">
            {item.price}
          </Text>

          <View className="flex-row items-center mt-1">
            <Text numberOfLines={1} className="text-slate-500 text-xs flex-1">
              {item.sold}
            </Text>

            <View className="h-4 w-[1px] bg-slate-300 mx-2" />

            <Ionicons name="star" size={13} color="#FBBF24" />

            <Text className="text-slate-600 text-xs ml-1">{item.rating}</Text>
          </View>

          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={14} color="#64748b" />

            <Text
              numberOfLines={1}
              className="text-slate-500 text-xs ml-1 flex-1"
            >
              {item.location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

// Set a display name for easier debugging with memoized components
ProductCard.displayName = "ProductCard";
