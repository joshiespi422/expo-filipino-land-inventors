import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ProductCard } from "@/components/ProductItems";
import {
  DetailedProduct,
  getProductShow,
  getStoreHome,
  Product,
} from "@/services/productService";

import delivery from "../../../assets/images/icon/deliveryBlueB.png";
import UserProfile from "../../../assets/images/UserProfile.jpg";

type ActionType = "cart" | "buy_now" | null;

export default function Products() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [mainImage, setMainImage] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState<number>(1);
  const [modal, setModal] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<ActionType>(null);

  useEffect(() => {
    if (!slug) {
      setError("No product identifier provided.");
      setLoading(false);
      return;
    }

    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        setQuantity(1);

        const response = await getProductShow(slug);
        const detailedProduct = response.product;
        setProduct(detailedProduct);

        let initialImage: string | null = null;
        if (detailedProduct.images && detailedProduct.images.length > 0) {
          initialImage = detailedProduct.images[0].url;
        }

        const initialSelections: Record<string, string> = {};

        const defaultVariant = detailedProduct.variants.find(
          (v) => v.is_default,
        );
        if (defaultVariant && defaultVariant.image) {
          initialImage = defaultVariant.image;
        }

        setMainImage(initialImage);
        setSelectedAttributes(initialSelections);

        if (
          detailedProduct.categories &&
          detailedProduct.categories.length > 0
        ) {
          const primaryCatId = detailedProduct.categories[0].id;
          const homeData = await getStoreHome(primaryCatId, 1);

          const combinedRecs = [
            ...(homeData.data.productsTopDeals || []),
            ...(homeData.data.productsDiscover || []),
          ];

          const uniqueRecs = combinedRecs.reduce((acc: Product[], current) => {
            const isDuplicate = acc.some((item) => item.id === current.id);
            if (!isDuplicate && current.id !== detailedProduct.id) {
              acc.push(current);
            }
            return acc;
          }, []);

          setRecommendations(uniqueRecs.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load product page details:", err);
        setError("Could not load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [slug]);

  // Exact variant match calculation
  const currentVariant = product?.variants.find(
    (v) =>
      v.attributes.every(
        (attr) => selectedAttributes[attr.name] === attr.value,
      ) && v.attributes.length === Object.keys(selectedAttributes).length,
  );

  const defaultVariant =
    product?.variants.find((v) => v.is_default) || product?.variants[0];

  // Dynamic values depending on active combinations selected by user
  const displayPrice = currentVariant
    ? currentVariant.price
    : defaultVariant
      ? defaultVariant.price
      : "0";
  const displayComparePrice = currentVariant
    ? currentVariant.compare_price
    : defaultVariant
      ? defaultVariant.compare_price
      : null;

  // Calculate clean stock pools relative to partial or full selections
  const totalDefaultStock =
    product?.variants.reduce((acc, v) => acc + v.stock, 0) || 0;

  const currentStock = currentVariant
    ? currentVariant.stock
    : Object.keys(selectedAttributes).length > 0
      ? product?.variants
          .filter((v) =>
            Object.entries(selectedAttributes).every(([key, val]) =>
              v.attributes.some((a) => a.name === key && a.value === val),
            ),
          )
          .reduce((acc, v) => acc + v.stock, 0) || 0
      : totalDefaultStock;

  const getGroupedAttributes = () => {
    if (!product) return {};
    const grouped: Record<string, string[]> = {};

    product.variants.forEach((v) => {
      v.attributes.forEach((attr) => {
        if (!grouped[attr.name]) {
          grouped[attr.name] = [];
        }
        if (!grouped[attr.name].includes(attr.value)) {
          grouped[attr.name].push(attr.value);
        }
      });
    });
    return grouped;
  };

  const groupedAttributes = getGroupedAttributes();

  // Look-ahead check to verify if a combination variation is valid and has stock
  const isOptionAvailable = (attributeName: string, optionValue: string) => {
    if (!product) return false;

    // Simulate what selections look like with this option variant checked
    const testSelections = {
      ...selectedAttributes,
      [attributeName]: optionValue,
    };

    // Find if there is at least one variant that matches all simulated parameters and has stock
    return product.variants.some((variant) => {
      const matchesSelections = Object.entries(testSelections).every(
        ([key, val]) =>
          variant.attributes.some(
            (attr) => attr.name === key && attr.value === val,
          ),
      );
      return matchesSelections && variant.stock > 0;
    });
  };

  const handleAttributeSelect = (attributeName: string, value: string) => {
    let updatedSelections = { ...selectedAttributes };

    if (updatedSelections[attributeName] === value) {
      delete updatedSelections[attributeName];
    } else {
      updatedSelections[attributeName] = value;
    }

    setSelectedAttributes(updatedSelections);

    const matchingVariant = product?.variants.find(
      (v) =>
        v.attributes.every(
          (attr) => updatedSelections[attr.name] === attr.value,
        ) && v.attributes.length === Object.keys(updatedSelections).length,
    );

    if (matchingVariant?.image) {
      setMainImage(matchingVariant.image);
    }

    if (matchingVariant) {
      if (matchingVariant.stock === 0) {
        setQuantity(0);
      } else if (quantity > matchingVariant.stock || quantity === 0) {
        setQuantity(matchingVariant.stock);
      }
    } else {
      setQuantity(1);
    }
  };

  const handleProductPress = (recommendedSlug: string) => {
    if (!recommendedSlug) return;
    router.push({
      pathname: "/products/[slug]",
      params: { slug: recommendedSlug },
    });
  };

  // Triggers the modal with contextual redirect paths
  const openPurchaseModal = (action: ActionType) => {
    setModalAction(action);
    setModal(true);
  };

  const handleConfirmAction = () => {
    setModal(false);
    if (modalAction === "cart") {
      router.push("/cart");
    } else if (modalAction === "buy_now") {
      router.push("/checkout");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0052cc" />
        <Text className="mt-4 text-slate-500 font-medium">
          Loading details...
        </Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#D70127" />
        <Text className="text-xl font-semibold text-slate-800 mt-4 text-center">
          {error || "Product not found"}
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

  const fallbackImageUri = product.images?.[0]?.url || "";

  // Dynamic unique array calculation for continuous inline rendering of Gallery thumbnails
  const dynamicGalleryUrls = (product.images || [])
    .map((img) => img.url)
    .concat(
      (product.variants || [])
        .map((v) => v.image)
        .filter((img): img is string => !!img),
    )
    .filter((url, index, self) => self.indexOf(url) === index);

  return (
    <View className="flex-1 bg-white p-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* MAIN IMAGE */}
        <View className="p-1 border border-primary/20 shadow-brand rounded-2xl">
          {mainImage || fallbackImageUri ? (
            <Image
              source={{
                uri: mainImage
                  ? mainImage.startsWith("http")
                    ? mainImage
                    : `http://192.168.1.53:8000${mainImage}`
                  : fallbackImageUri.startsWith("http")
                    ? fallbackImageUri
                    : `http://192.168.1.53:8000${fallbackImageUri}`,
              }}
              className="rounded-xl"
              style={{ width: "100%", height: 350 }}
            />
          ) : (
            <View
              style={{ width: "100%", height: 350 }}
              className="bg-slate-100 items-center border border-green-900 justify-center rounded-xl"
            >
              <Ionicons name="image-outline" size={48} color="#94a3b8" />
            </View>
          )}
        </View>

        {/* IMAGE GALLERY */}
        {dynamicGalleryUrls.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4 px-2"
          >
            {dynamicGalleryUrls.map((imgUrl, index) => (
              <TouchableOpacity
                key={`gallery-img-${index}`}
                onPress={() => setMainImage(imgUrl)}
                className={`mr-3 rounded-md overflow-hidden border-2 ${
                  mainImage === imgUrl ? "border-primary" : "border-slate-200"
                }`}
              >
                <Image
                  source={{
                    uri: imgUrl.startsWith("http")
                      ? imgUrl
                      : `http://192.168.1.53:8000${imgUrl}`,
                  }}
                  style={{ width: 70, height: 70 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* CONTAINER INFO */}
        <View className="py-4 px-3">
          <View className="flex-row pb-4 items-end justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-[#D70127] text-2xl font-semibold mt-2">
                ₱
                {Number(displayPrice).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              {displayComparePrice && (
                <Text className="text-slate-400 line-through text-sm mt-3">
                  ₱
                  {Number(displayComparePrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
            </View>
            <View className="flex-row gap-3 items-center">
              <Text className="text-slate-500">1.2k sold</Text>
              <Text className="text-slate-300">|</Text>
              <Text className="text-slate-500">Stock: {currentStock}</Text>
            </View>
          </View>

          <Text className="text-2xl font-semibold text-primary">
            {product.name}
          </Text>
          <Text className="text-slate-700 text-lg mt-2">
            {product.description || "No product description provided."}
          </Text>

          {/* SHIPPING METRICS */}
          <View className="mt-5 bg-blue rounded-xl p-3">
            <View className="flex-row gap-3 items-center">
              <Image
                source={delivery}
                className="rounded-xl"
                style={{ width: 80, height: 40, resizeMode: "contain" }}
              />
              <View className="flex-1">
                <View className="bg-primary self-start px-5 py-1 rounded-full">
                  <Text className="text-white text-[13px]">Fast Delivery</Text>
                </View>
                <Text className="text-slate-600 mt-1 text-[12px]">
                  Fast, reliable, and always on time because you deserve
                  delivery that moves at your speed.
                </Text>
              </View>
            </View>
          </View>

          {/* CUSTOMER REVIEWS */}
          <View className="mt-5 bg-blue rounded-xl p-4">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-base">
                <Text className="text-slate-500 pr-3">4.9 ⭐</Text> Customer
                Feedback
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
                        style={{ width: 45, height: 45, borderRadius: 100 }}
                      />
                      <View className="ml-3 flex-1">
                        <Text className="font-semibold">{review.name}</Text>
                        <Text className="text-slate-500">
                          ⭐ {review.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className="text-slate-600 mt-3">{review.comment}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* MERCHANT PARTNER */}
          {product.store && (
            <View className="mt-5 border-2 border-blue rounded-xl p-4">
              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-2">
                  <Image
                    source={
                      product.store.logo
                        ? { uri: product.store.logo }
                        : UserProfile
                    }
                    style={{ width: 45, height: 45, borderRadius: 100 }}
                  />
                  <View>
                    <Text
                      className="text-primary text-xl font-semibold"
                      style={{ lineHeight: 24 }}
                    >
                      {product.store.name} {product.store.is_official && "🛡️"}
                    </Text>
                    <Text
                      className="text-slate-500"
                      style={{ lineHeight: 16, marginTop: -2 }}
                    >
                      Merchant Partner
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/store",
                      params: { seller: product.store.name },
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
                  <Text className="text-center font-semibold">4.8</Text>
                  <Text className="text-center text-xs text-slate-500">
                    Rating
                  </Text>
                </View>
                <View>
                  <Text className="text-center font-semibold">Official</Text>
                  <Text className="text-center text-xs text-slate-500">
                    Store Status
                  </Text>
                </View>
                <View>
                  <Text className="text-center font-semibold">100%</Text>
                  <Text className="text-center text-xs text-slate-500">
                    Chat Response
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* RECOMMENDATIONS LIST */}
        <View className="pt-3">
          <View className="w-full h-[10px] bg-slate-300"></View>
          <View className="py-4 px-3">
            <View className="bg-blue py-2.5 rounded-md mb-4">
              <Text className="text-primary text-center font-bold text-xl">
                Products you may like
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {recommendations.map((item) => (
                <ProductCard
                  key={item.id}
                  item={{
                    id: item.id.toString(),
                    name: item.name,
                    price: item.price
                      ? `₱${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "₱0.00",
                    image: item.image ?? "",
                    sold: `${item.stock} stocks`,
                    rating: "5.0",
                    location: "FISMPC Store",
                    category: "",
                  }}
                  onPress={() => handleProductPress(item.slug)}
                />
              ))}
              {recommendations.length === 0 && (
                <Text className="text-center text-slate-400 w-full py-4">
                  No other products found in this category.
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
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
            onPress={() => openPurchaseModal("cart")}
            className="flex-1 p-1.5 bg-primary rounded-xl items-center justify-center"
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            <Text className="text-white font-semibold text-base pt-1">
              Add to cart
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openPurchaseModal("buy_now")}
            className="flex-1 p-1.5 bg-[#D70127] rounded-xl items-center justify-center"
          >
            <Text className="text-white font-semibold text-base">Buy Now</Text>
            <Text className="text-white font-semibold text-base">
              ₱
              {Number(displayPrice).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VARIANT PICKER MODAL */}
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
              <View className="flex-row p-5 border-b border-slate-100">
                <Image
                  source={{
                    uri: mainImage
                      ? mainImage.startsWith("http")
                        ? mainImage
                        : `http://192.168.1.53:8000${mainImage}`
                      : fallbackImageUri.startsWith("http")
                        ? fallbackImageUri
                        : `http://192.168.1.53:8000${fallbackImageUri}`,
                  }}
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
                  <Text className="text-[#D70127] text-xl font-bold mt-1">
                    ₱
                    {Number(displayPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1 flex-wrap">
                    <Text className="text-slate-500 text-xs">
                      Selected:{" "}
                      {Object.entries(selectedAttributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ") || "None"}
                    </Text>
                    <Text className="text-slate-300 text-xs">|</Text>
                    <Text className="text-slate-500 text-xs font-medium">
                      Stock: {currentStock}
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

              <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                {Object.keys(groupedAttributes).map((attributeName) => (
                  <View key={attributeName} className="mb-5">
                    <Text className="font-bold text-slate-700 mb-2.5">
                      {attributeName}
                    </Text>
                    <View className="flex-row flex-wrap">
                      {groupedAttributes[attributeName].map((optionValue) => {
                        const isCurrentlySelected =
                          selectedAttributes[attributeName] === optionValue;

                        // Run lookahead checks to see if this option combination is valid
                        const isAvailable = isOptionAvailable(
                          attributeName,
                          optionValue,
                        );

                        return (
                          <TouchableOpacity
                            key={optionValue}
                            disabled={!isAvailable && !isCurrentlySelected}
                            onPress={() =>
                              handleAttributeSelect(attributeName, optionValue)
                            }
                            className={`flex-row items-center px-3 py-2 rounded-xl border mr-2 mb-2 ${
                              isCurrentlySelected
                                ? "bg-blue-50 border-primary"
                                : !isAvailable
                                  ? "border-slate-100 bg-slate-100 opacity-40"
                                  : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <Text
                              className={`text-sm ${
                                isCurrentlySelected
                                  ? "text-primary font-semibold"
                                  : !isAvailable
                                    ? "text-slate-400"
                                    : "text-slate-700"
                              }`}
                            >
                              {optionValue}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                <View className="flex-row justify-between items-center pt-4 border-t border-slate-100">
                  <Text className="font-bold text-slate-700">Quantity</Text>
                  <View className="flex-row items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <TouchableOpacity
                      onPress={() =>
                        setQuantity(
                          Math.max(currentStock > 0 ? 1 : 0, quantity - 1),
                        )
                      }
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
                      onPress={() =>
                        setQuantity(Math.min(currentStock, quantity + 1))
                      }
                      className="px-4 py-2 bg-slate-100 active:bg-slate-200"
                    >
                      <Text className="text-lg font-bold text-slate-600">
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View className="w-full p-5 bg-white border-t border-slate-200">
                <TouchableOpacity
                  onPress={handleConfirmAction}
                  disabled={
                    currentStock === 0 ||
                    quantity === 0 ||
                    Object.keys(selectedAttributes).length !==
                      Object.keys(groupedAttributes).length
                  }
                  className={`h-16 rounded-2xl justify-center items-center ${
                    currentStock === 0 ||
                    quantity === 0 ||
                    Object.keys(selectedAttributes).length !==
                      Object.keys(groupedAttributes).length
                      ? "bg-slate-300"
                      : modalAction === "buy_now"
                        ? "bg-[#D70127]"
                        : "bg-primary"
                  }`}
                >
                  <Text className="text-white font-bold text-lg">
                    {Object.keys(selectedAttributes).length !==
                    Object.keys(groupedAttributes).length
                      ? "Select Options"
                      : currentStock === 0
                        ? "Out of Stock"
                        : modalAction === "buy_now"
                          ? "Buy Now"
                          : "Add to Cart"}
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
