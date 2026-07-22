import {
  fetchOrderForRatingAPI,
  MediaFile,
  submitOrderRatingAPI,
} from "@/services/order";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ItemRatingState {
  order_item_id: number;
  product_name: string;
  product_image: string | null;
  variant_name: string | null;
  rating: number;
  comment: string;
  is_anonymous: boolean;
  video: MediaFile | null;
  images: MediaFile[];
}

export default function RatingProductsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>("");
  const [itemRatings, setItemRatings] = useState<ItemRatingState[]>([]);

  useEffect(() => {
    if (orderId) {
      loadRatingData();
    }
  }, [orderId]);

  const loadRatingData = async () => {
    try {
      setIsLoading(true);
      const res = await fetchOrderForRatingAPI(orderId!);
      if (res.success) {
        setStoreName(res.data.order.store?.name || "Store");
        const initialStates: ItemRatingState[] = res.data.order.items.map(
          (item) => ({
            order_item_id: item.id,
            product_name: item.product_name,
            product_image: item.product_image,
            variant_name: item.variant_name,
            rating: 5, // default to 5 stars
            comment: "",
            is_anonymous: false,
            video: null,
            images: [],
          }),
        );
        setItemRatings(initialStates);
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to load order for rating.",
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemState = (
    index: number,
    field: keyof ItemRatingState,
    value: any,
  ) => {
    setItemRatings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const pickImages = async (index: number) => {
    const currentImages = itemRatings[index].images;
    if (currentImages.length >= 5) {
      Alert.alert("Limit Reached", "You can upload up to 5 images per item.");
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - currentImages.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMediaFiles: MediaFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      }));
      updateItemState(index, "images", [...currentImages, ...newMediaFiles]);
    }
  };

  const pickVideo = async (index: number) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const videoFile: MediaFile = {
        uri: asset.uri,
        name: asset.fileName || `video_${Date.now()}.mp4`,
        type: asset.mimeType || "video/mp4",
      };
      updateItemState(index, "video", videoFile);
    }
  };

  const removeImage = (itemIndex: number, imgIdx: number) => {
    const updatedImages = itemRatings[itemIndex].images.filter(
      (_, idx) => idx !== imgIdx,
    );
    updateItemState(itemIndex, "images", updatedImages);
  };

  const removeVideo = (itemIndex: number) => {
    updateItemState(itemIndex, "video", null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = itemRatings.map((item) => ({
        order_item_id: item.order_item_id,
        rating: item.rating,
        comment: item.comment,
        is_anonymous: item.is_anonymous,
        video: item.video,
        images: item.images,
      }));

      const res = await submitOrderRatingAPI(orderId!, payload);
      if (res.success) {
        Alert.alert("Thank You!", res.message || "Feedback submitted!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      Alert.alert(
        "Submission Error",
        err?.response?.data?.message || "Failed to submit reviews.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-100">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      {/* HEADER */}
      <View className="bg-white pt-12 pb-4 px-4 border-b border-slate-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">Rate Products</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ pb: 120 }}
      >
        {itemRatings.map((item, index) => (
          <View
            key={item.order_item_id}
            className="bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm"
          >
            {/* PRODUCT SUMMARY */}
            <View className="flex-row items-center pb-3 mb-3 border-b border-slate-100">
              <Image
                source={{
                  uri:
                    item.product_image && item.product_image.startsWith("http")
                      ? item.product_image
                      : `http://192.168.42.10:8000${item.product_image || ""}`,
                }}
                className="w-14 h-14 rounded-lg bg-slate-100"
              />
              <View className="ml-3 flex-1">
                <Text
                  numberOfLines={1}
                  className="font-semibold text-slate-800 text-sm"
                >
                  {item.product_name}
                </Text>
                {item.variant_name ? (
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {item.variant_name}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* STAR RATING PICKER */}
            <View className="items-center my-2">
              <Text className="text-xs font-semibold text-slate-500 mb-2">
                Overall Quality
              </Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => updateItemState(index, "rating", star)}
                  >
                    <Ionicons
                      name={star <= item.rating ? "star" : "star-outline"}
                      size={32}
                      color={star <= item.rating ? "#eab308" : "#94a3b8"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* COMMENT INPUT */}
            <View className="mt-4">
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Share your thoughts about this product..."
                value={item.comment}
                onChangeText={(text) => updateItemState(index, "comment", text)}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 min-h-[90px]"
                textAlignVertical="top"
              />
            </View>

            {/* MEDIA UPLOAD SECTION */}
            <View className="mt-4">
              <Text className="text-xs font-semibold text-slate-600 mb-2">
                Add Photo / Video
              </Text>
              <View className="flex-row flex-wrap gap-2 items-center">
                {/* VIDEO PREVIEW */}
                {item.video && (
                  <View className="w-20 h-20 bg-slate-900 rounded-xl justify-center items-center relative">
                    <Ionicons name="videocam" size={28} color="#fff" />
                    <TouchableOpacity
                      onPress={() => removeVideo(index)}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* IMAGES PREVIEWS */}
                {item.images.map((img, imgIdx) => (
                  <View key={imgIdx} className="w-20 h-20 relative">
                    <Image
                      source={{ uri: img.uri }}
                      className="w-full h-full rounded-xl bg-slate-200"
                    />
                    <TouchableOpacity
                      onPress={() => removeImage(index, imgIdx)}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* ADD PHOTO BUTTON */}
                {item.images.length < 5 && (
                  <TouchableOpacity
                    onPress={() => pickImages(index)}
                    className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl justify-center items-center bg-slate-50"
                  >
                    <Ionicons name="camera-outline" size={22} color="#64748b" />
                    <Text className="text-[10px] text-slate-500 mt-1">
                      + Photo
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ADD VIDEO BUTTON */}
                {!item.video && (
                  <TouchableOpacity
                    onPress={() => pickVideo(index)}
                    className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl justify-center items-center bg-slate-50"
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={22}
                      color="#64748b"
                    />
                    <Text className="text-[10px] text-slate-500 mt-1">
                      + Video
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ANONYMOUS TOGGLE */}
            <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-slate-100">
              <View className="flex-row items-center">
                <Ionicons name="eye-off-outline" size={18} color="#64748b" />
                <Text className="text-xs text-slate-600 font-medium ml-2">
                  Submit Anonymously
                </Text>
              </View>
              <Switch
                value={item.is_anonymous}
                onValueChange={(val) =>
                  updateItemState(index, "is_anonymous", val)
                }
                trackColor={{ false: "#cbd5e1", true: "#034194" }}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FOOTER SUBMIT BUTTON */}
      <View className="p-4 bg-white border-t border-slate-200">
        <TouchableOpacity
          disabled={isSubmitting}
          onPress={handleSubmit}
          className="bg-primary py-3.5 rounded-xl justify-center items-center flex-row"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" className="mr-2" />
          ) : null}
          <Text className="text-white font-bold text-base">Submit Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
