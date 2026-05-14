import { checkIntellectualPaymentStatus } from "@/services/intellectualService";
import { Ionicons } from "@expo/vector-icons";
// Use the legacy import to stop the warnings and fix the "undefined" errors
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function IntellectualQRPaymentPage() {
  const { qrUrl, paymentIntentId, intellectualId, amount, expiresAt } =
    useLocalSearchParams();
  const router = useRouter();

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const hasShownSuccess = useRef(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [saving, setSaving] = useState(false);

  // Timer logic - Updated to handle ISO Date Strings (e.g., "2026-05-14T...")
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("---");
      return;
    }

    const timer = setInterval(() => {
      // Parse ISO string into timestamp
      const expiry = new Date(expiresAt as string).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (isNaN(expiry) || diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(timer);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  // Polling logic
  useEffect(() => {
    if (!paymentIntentId) return;

    pollingInterval.current = setInterval(async () => {
      try {
        const res = await checkIntellectualPaymentStatus(
          paymentIntentId as string,
        );
        // Assuming status 11 means success
        if (Number(res?.status) === 11 && !hasShownSuccess.current) {
          hasShownSuccess.current = true;
          if (pollingInterval.current) clearInterval(pollingInterval.current);

          Alert.alert("Success", "Payment confirmed!", [
            {
              text: "OK",
              onPress: () =>
                router.replace({
                  pathname: "/intellectual-breakdown",
                  params: { id: String(intellectualId) },
                }),
            },
          ]);
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [paymentIntentId]);

  const handleSaveQR = async () => {
    if (!qrUrl) return;

    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Allow gallery access to save the QR.",
        );
        return;
      }

      const filename = `QR_${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      if (qrUrl.startsWith("data:image")) {
        // --- FIX FOR BASE64 STRINGS ---
        // 1. Remove the header (e.g., "data:image/png;base64,")
        const base64Code = qrUrl.split("base64,")[1];

        // 2. Write the file directly to the phone's storage
        await FileSystem.writeAsStringAsync(fileUri, base64Code, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        // --- FALLBACK FOR STANDARD HTTP URLS ---
        const downloadResult = await FileSystem.downloadAsync(qrUrl, fileUri);
        if (downloadResult.status !== 200) throw new Error("Download failed");
      }

      // 3. Save the newly created file to the Gallery
      await MediaLibrary.saveToLibraryAsync(fileUri);

      Alert.alert("Saved!", "QR Code has been saved to your gallery.");
    } catch (error) {
      console.log("SAVE ERROR:", error);
      Alert.alert("Error", "Could not save image. Try taking a screenshot.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 24,
      }}
    >
      <View className="items-center mb-6">
        <Text className="text-gray-500 text-base mb-1">Total Payment</Text>
        <Text className="text-primary text-3xl font-bold">
          ₱{" "}
          {Number(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>

      <View className="flex-row items-center bg-orange-50 px-4 py-2 rounded-full mb-6">
        <Ionicons name="time-outline" size={18} color="#f97316" />
        <Text className="text-orange-600 font-medium ml-2">
          Valid for: {timeLeft}
        </Text>
      </View>

      {qrUrl ? (
        <View className="items-center">
          <View className="p-4 border-2 border-gray-100 rounded-[32px] bg-white shadow-sm mb-4">
            <Image
              source={{ uri: qrUrl as string }}
              style={{ width: 260, height: 260 }}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            onPress={handleSaveQR}
            disabled={saving}
            className="flex-row items-center bg-primary/10 px-6 py-3 rounded-full mb-8"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#000" />
            )}
            <Text className="text-primary font-bold ml-2">
              {saving ? "Saving..." : "Save to Gallery"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ActivityIndicator size="large" className="h-64" />
      )}

      <View className="bg-gray-50 p-5 rounded-2xl w-full border border-gray-100">
        <Text className="text-gray-800 font-bold mb-3">
          Easy Payment Steps:
        </Text>
        <Text className="text-gray-600 mb-2">
          1. Save this QR or take a screenshot.
        </Text>
        <Text className="text-gray-600 mb-2">
          2. Open GCash, Maya, or your Bank App.
        </Text>
        <Text className="text-gray-600 mb-2">
          3. Select Scan QR and upload this image.
        </Text>
        <View className="mt-2 pt-2 border-t border-gray-200">
          <Text className="text-xs text-gray-400 italic">
            This page will update automatically once payment is received.
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.back()} className="mt-10">
        <Text className="text-gray-400 underline">Cancel Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
