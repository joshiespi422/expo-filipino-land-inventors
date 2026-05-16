import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CameraScreen() {
  const router = useRouter();
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();

  // 📌 Permission handling
  useEffect(() => {
    if (!permission) return;

    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted]);

  // 📷 AUTO QR SCAN (NO MANUAL BUTTON)
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // prevent spam scanning same QR repeatedly
    if (cooldownRef.current) return;

    if (lastScannedRef.current === data) return;

    cooldownRef.current = true;
    lastScannedRef.current = data;

    // short cooldown to avoid duplicate triggers
    setTimeout(() => {
      cooldownRef.current = false;
    }, 1500);

    try {
      const isUrl = data.startsWith("http://") || data.startsWith("https://");

      if (isUrl) {
        await Linking.openURL(data);
        return;
      }

      Alert.alert("QR Code Detected", data);
    } catch (error) {
      Alert.alert("Error", "Unable to process QR Code");
    }
  };

  // 🔄 LOADING
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // 🚫 NO PERMISSION
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-6">
        <Text className="text-white text-lg text-center mb-4">
          Camera permission is required
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#C6890F] px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 📷 CAMERA VIEW
  return (
    <View className="flex-1 bg-black">
      {/* CAMERA */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* 🌑 UI OVERLAY */}
      <View className="absolute inset-0 bg-black/40 items-center justify-center">
        {/* TOP BAR */}
        <View className="absolute top-12 w-full flex-row justify-between px-5">
          {/* BACK */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-black/60 p-3 rounded-full"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-lg font-semibold">QR Scanner</Text>

          <View style={{ width: 40 }} />
        </View>

        {/* SCAN FRAME */}
        <View className="items-center justify-center">
          <View className="w-[270px] h-[270px] border-2 border-[#C6890F] rounded-3xl bg-black/10" />

          <Text className="text-white mt-4 text-sm opacity-80">
            Point your camera at QR code
          </Text>
        </View>
      </View>
    </View>
  );
}
