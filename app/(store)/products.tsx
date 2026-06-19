import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Imports requested for shared service list and dynamic product recommendations
import { ProductCard } from "@/components/ProductItems";
import { products as allProducts } from "@/services/productService";

import delivery from "../../assets/images/icon/deliveryBlueB.png";
import UserProfile from "../../assets/images/UserProfile.jpg";

const products = [
  {
    id: "1",
    name: "Premium T-Shirt Oversized Cotton Casual Wear",
    price: "₱399",
    originalPrice: "₱499",
    discountPercentage: "20%",
    sold: "1.2k sold",
    stock: 45, // Added total stock field
    rating: "5.0",
    location: "Las Piñas City",
    category: "Clothes",
    description:
      "Premium quality cotton shirt perfect for daily wear. Comfortable and durable.",
    images: [
      "https://picsum.photos/500?1", // index 0 (Black)
      "https://picsum.photos/500?2", // index 1 (White)
      "https://picsum.photos/500?3", // index 2 (Blue)
    ],
    seller: {
      name: "Fashion Store",
      rating: "4.9",
      products: "500+",
    },
    variants: [
      {
        title: "Color",
        options: ["Black", "White", "Blue"],
      },
      {
        title: "Size",
        options: ["Small", "Medium", "Large"],
      },
    ],
  },
];

export default function Products() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const product = products.find((item) => item.id === id);

  const [mainImage, setMainImage] = useState(product?.images[0]);
  const [selectedVariant, setSelectedVariant] = useState<any>({
    Color: "Black",
    Size: "Medium",
  });
  const [quantity, setQuantity] = useState(1);
  const [modal, setModal] = useState(false);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Product not found</Text>
      </View>
    );
  }

  const getVariantImage = (colorOption: string) => {
    if (colorOption === "White") return product.images[1];
    if (colorOption === "Blue") return product.images[2];
    return product.images[0];
  };

  const matchingCategoryProducts = allProducts.filter(
    (item) => item.category === product.category && item.id !== product.id,
  );

  const handleProductPress = (recommendedId: string) => {
    router.push({
      pathname: "/products",
      params: { id: recommendedId },
    });
  };

  const handleVariantSelect = (title: string, option: string) => {
    setSelectedVariant({
      ...selectedVariant,
      [title]: option,
    });

    if (title === "Color") {
      setMainImage(getVariantImage(option));
    }
  };

  return (
    <View className="flex-1 bg-white p-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 90,
        }}
      >
        {/* MAIN IMAGE */}
        <View className="p-1 border border-primary/20 shadow-brand rounded-2xl">
          <Image
            source={{ uri: mainImage }}
            className="rounded-xl"
            style={{
              width: "100%",
              height: 350,
            }}
          />
        </View>

        {/* IMAGE LIST */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 px-2"
        >
          {product.images.map((img, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setMainImage(img)}
              className="mr-3"
            >
              <Image
                source={{ uri: img }}
                style={{
                  width: 70,
                  height: 70,
                }}
                className="rounded-md"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* INFO */}
        <View className="py-4 px-3">
          <View className="flex-row pb-4 items-end justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-[#D70127] text-2xl font-semibold mt-2">
                {product.price}
              </Text>
              {product.originalPrice && (
                <Text className="text-slate-400 line-through text-sm mt-3">
                  {product.originalPrice}
                </Text>
              )}
            </View>
            <View className="flex-row gap-3 items-center">
              <Text className="text-slate-500">{product.sold}</Text>
              <Text className="text-slate-300">|</Text>
              <Text className="text-slate-500">Stock: {product.stock}</Text>
            </View>
          </View>

          <Text className="text-2xl font-semibold text-primary">
            {product.name}
          </Text>

          <Text className="text-slate-700 text-lg mt-2">
            {product.description}
          </Text>

          <View className="mt-5 bg-blue rounded-xl p-3">
            <View className="flex-row gap-3 items-center">
              <Image
                source={delivery}
                className="rounded-xl"
                style={{
                  width: 80,
                  height: 40,
                  resizeMode: "contain",
                }}
              />
              <View className="flex-1">
                <View className="bg-primary self-start px-5 py-1 rounded-full">
                  <Text className="text-white text-[13px]">
                    14 Apr / 15 Apr
                  </Text>
                </View>
                <Text className="text-slate-600 mt-1 text-[12px]">
                  Fast, reliable, and always on time because you deserve
                  delivery that moves at your speed.
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 bg-blue rounded-xl p-4">
            <View>
              <View className="flex-row justify-between items-center">
                <Text className="font-semibold text-base">
                  <Text className="text-slate-500 pr-3">
                    {product.seller.rating} ⭐
                  </Text>
                  {"    "}
                  Customer Feedback
                </Text>
                <TouchableOpacity>
                  <Text className="text-primary font-medium">See All</Text>
                </TouchableOpacity>
              </View>

              <View className="mt-3 gap-3">
                {[
                  {
                    name: "Juan Dela Cruz",
                    rating: 5,
                    comment: "Very good product, fast delivery!",
                  },
                  {
                    name: "Maria Santos",
                    rating: 5,
                    comment: "Item is exactly what I expected.",
                  },
                ].map((review, index) => (
                  <View key={index} className="bg-white rounded-xl p-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-row items-center flex-1">
                        <Image
                          source={UserProfile}
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: 100,
                          }}
                        />
                        <View className="ml-3 flex-1">
                          <Text className="font-semibold">{review.name}</Text>
                          <Text className="text-slate-500">
                            ⭐ {review.rating}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-slate-600 mt-3">
                      {review.comment}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="mt-5 border-2 border-blue rounded-xl p-4">
            <View className="flex-row justify-between">
              <View className="flex-row items-center gap-2">
                <Image
                  source={UserProfile}
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 100,
                  }}
                />
                <View>
                  <Text
                    className="text-primary text-xl font-semibold"
                    style={{ lineHeight: 24 }}
                  >
                    {product.seller.name}
                  </Text>
                  <Text
                    className="text-slate-500"
                    style={{ lineHeight: 16, marginTop: -2 }}
                  >
                    {product.location}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/store",
                    params: { seller: product.seller.name },
                  })
                }
              >
                <View className="bg-blue py-1 px-5 border border-primary rounded-lg">
                  <Text className="text-primary font-semibold">Visit</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mt-4">
              <View>
                <Text className="text-center font-semibold">4.5%</Text>
                <Text className="text-center">Rating</Text>
              </View>
              <View className="text-center">
                <Text className="text-center font-semibold">
                  {product.seller.products}
                </Text>
                <Text className="text-center">Products</Text>
              </View>
              <View className="text-center">
                <Text className="text-center font-semibold">100%</Text>
                <Text className="text-center">Chat Response</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="pt-3">
          <View className="w-full h-[10px] bg-slate-300"></View>
          <View className="py-4 px-3">
            <View className="bg-blue py-2.5 rounded-md mb-4">
              <Text className="text-primary text-center font-bold text-xl">
                Products you may like
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {matchingCategoryProducts.map((item: any) => (
                <ProductCard
                  key={item.id}
                  item={{
                    ...item,
                    image: item.image || item.images?.[0] || "",
                  }}
                  onPress={() => handleProductPress(item.id)}
                />
              ))}
              {matchingCategoryProducts.length === 0 && (
                <Text className="text-center text-slate-400 w-full py-4">
                  No other products found in this category.
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTION BUTTONS */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-3 border-t border-slate-100">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push("/chat-seller")}
            className="flex-1 p-1.5 bg-green-500 rounded-xl items-center justify-center"
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text className="text-white font-semibold text-base pt-1">
              Chat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModal(true)}
            className="flex-1 p-1.5 bg-primary rounded-xl items-center justify-center"
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <Text className="text-white font-semibold text-base pt-1">
              Add to cart
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setModal(true)}
            className="flex-1 p-1.5 bg-[#D70127] rounded-xl items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Buy Now</Text>
            <Text className="text-white font-semibold text-base">
              {product.price}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* POPUP MODAL WITH ANCHORED EXIT OVERLAY */}
      <Modal
        visible={modal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModal(false)}
        >
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl max-h-[85%] w-full flex-col">
              {/* Header Content Info */}
              <View className="flex-row p-5 border-b border-slate-100">
                <Image
                  source={{ uri: getVariantImage(selectedVariant["Color"]) }}
                  style={{ width: 90, height: 90 }}
                  className="rounded-xl border border-slate-200"
                />
                <View className="ml-4 flex-1 justify-center">
                  <Text
                    className="text-lg font-bold text-slate-800"
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-[#D70127] text-xl font-bold">
                      {product.price}
                    </Text>
                    <View className="bg-red-100 px-2 py-0.5 rounded">
                      <Text className="text-[#D70127] text-xs font-bold">
                        {product.discountPercentage} OFF
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5 mt-1 flex-wrap">
                    <Text className="text-slate-500 text-xs">
                      Selected: {selectedVariant["Color"] || "None"},{" "}
                      {selectedVariant["Size"] || "None"}
                    </Text>
                    <Text className="text-slate-300 text-xs">|</Text>
                    <Text className="text-slate-500 text-xs font-medium">
                      Stock: {product.stock}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setModal(false)}
                  className="p-1"
                >
                  <Ionicons name="close-circle" size={26} color="#cbd5e1" />
                </TouchableOpacity>
              </View>

              {/* Dynamic Items Selection Area */}
              <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                {product.variants.map((variant, index) => (
                  <View key={index} className="mb-5">
                    <Text className="font-bold text-slate-700 mb-2.5">
                      {variant.title}
                    </Text>
                    <View className="flex-row flex-wrap">
                      {variant.options.map((option) => {
                        const isColor = variant.title === "Color";
                        const isOriginalSelected =
                          selectedVariant[variant.title] === option;

                        return (
                          <TouchableOpacity
                            key={option}
                            onPress={() =>
                              handleVariantSelect(variant.title, option)
                            }
                            className={`flex-row items-center px-3 py-2 rounded-xl border mr-2 mb-2 ${
                              isOriginalSelected
                                ? "bg-blue-50 border-primary"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {isColor && (
                              <Image
                                source={{ uri: getVariantImage(option) }}
                                className="w-6 h-6 rounded-md mr-2 border border-slate-300"
                              />
                            )}
                            <Text
                              className={`text-sm ${isOriginalSelected ? "text-primary font-semibold" : "text-slate-700"}`}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* Quantity Counter Row */}
                <View className="flex-row justify-between items-center pt-4 border-t border-slate-100">
                  <Text className="font-bold text-slate-700">Quantity</Text>
                  <View className="flex-row items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <TouchableOpacity
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 bg-slate-100 active:bg-slate-200"
                    >
                      <Text className="text-lg font-bold text-slate-600">
                        -
                      </Text>
                    </TouchableOpacity>

                    <Text className="px-5 font-semibold text-base text-slate-800">
                      {quantity}
                    </Text>

                    <TouchableOpacity
                      onPress={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 bg-slate-100 active:bg-slate-200"
                    >
                      <Text className="text-lg font-bold text-slate-600">
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* Action Button Layout Group */}
              <View className="w-full p-5 bg-white border-t border-slate-200">
                <TouchableOpacity
                  onPress={() => setModal(false)}
                  className="h-16 rounded-2xl justify-center items-center bg-primary"
                >
                  <Text className="text-white font-bold text-lg">
                    Confirm Action
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
