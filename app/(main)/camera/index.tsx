import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // ✅ FIXED: only request permission if NOT granted AND status is known
  useEffect(() => {
    const getPermission = async () => {
      if (!permission) return;

      if (!permission.granted && permission.canAskAgain) {
        await requestPermission();
      }
    };

    getPermission();
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);

    try {
      const isUrl = data.startsWith("http://") || data.startsWith("https://");

      if (isUrl) {
        await Linking.openURL(data);
        return;
      }

      Alert.alert("QR Code Result", data, [
        {
          text: "Scan Again",
          onPress: () => setScanned(false),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Unable to process QR Code");
      setScanned(false);
    }
  };

  // 🔄 LOADING STATE
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  // 🚫 NO PERMISSION STATE
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-5">
        <Text className="text-lg text-black text-center mb-5">
          Camera permission is required
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-bold text-base">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 📷 CAMERA VIEW
  return (
    <View className="flex-1 bg-black">
      <CameraView
        className="flex-1"
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* OVERLAY */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-[260px] h-[260px] border-2 border-[#C6890F] rounded-2xl" />

        {scanned && (
          <TouchableOpacity
            onPress={() => setScanned(false)}
            className="absolute bottom-20 bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-bold text-base">Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
