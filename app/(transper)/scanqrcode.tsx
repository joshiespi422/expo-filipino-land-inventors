// app/scanqrcode.tsx
import { CustomAlert } from "@/components/CustomAlert";
import { parseInstapayQr } from "@/utils/emvQr";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScanQrCodePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [resolvingQr, setResolvingQr] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const scannedRef = useRef(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scannedRef.current || resolvingQr) {
      return;
    }

    const rawQr = data?.trim();

    if (!rawQr) {
      return;
    }

    scannedRef.current = true;
    setResolvingQr(true);

    try {
      const parsed = parseInstapayQr(rawQr);

      if (!parsed.accountNumber) {
        throw new Error(
          "Could not read account details automatically. Please enter recipient details manually.",
        );
      }

      router.replace({
        pathname: "../",
        params: {
          scannedName: parsed.merchantName ?? "",
          scannedNumber: parsed.accountNumber,
          scannedProvider: parsed.swiftCode ?? "",
          scannedRaw: rawQr,
        },
      });
    } catch (error: any) {
      const message = error?.message || "Unable to identify this QR code.";

      setAlertConfig({
        visible: true,
        title: "QR Code Error",
        message,
      });
    } finally {
      setResolvingQr(false);
    }
  };

  const handleCloseAlert = () => {
    setAlertConfig((prev) => ({
      ...prev,
      visible: false,
    }));

    scannedRef.current = false;
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Ionicons name="camera-outline" size={48} color="white" />

        <Text className="text-white text-center font-bold text-lg mt-4 mb-2">
          Camera access needed
        </Text>

        <Text className="text-slate-300 text-center text-sm mb-6">
          We need camera permission to scan the recipient{"'"}s QR code.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-primary px-6 py-3 rounded-xl mb-3"
          disabled={resolvingQr}
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={resolvingQr}>
          <Text className="text-slate-400 text-xs font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={resolvingQr ? undefined : handleBarcodeScanned}
      />

      <View className="absolute inset-0 justify-between">
        <View
          className="flex-row justify-between items-center px-5 z-10"
          style={{ marginTop: insets.top + 10 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={resolvingQr}
            className="bg-black/50 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={22} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTorchOn((prev) => !prev)}
            disabled={resolvingQr}
            className="bg-black/50 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons
              name={torchOn ? "flash" : "flash-off"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>

        <View className="items-center justify-center flex-1">
          <View className="w-64 h-64 relative">
            <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl" />
          </View>

          {resolvingQr ? (
            <View className="items-center mt-6">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-sm font-bold mt-3 text-center px-10">
                Reading QR code...
              </Text>
              <Text className="text-slate-300 text-xs mt-1 text-center px-10">
                Identifying the recipient
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-white text-sm font-bold mt-6 text-center px-10">
                Align the QR code within the frame
              </Text>
              <Text className="text-slate-300 text-xs mt-1 text-center px-10">
                QR Ph / InstaPay codes are scanned automatically
              </Text>
            </>
          )}
        </View>

        <View
          className="items-center z-10"
          style={{ marginBottom: Math.max(insets.bottom, 20) + 10 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={resolvingQr}
            className="px-6 py-3"
          >
            <Text className="text-white text-xs font-bold underline">
              Enter details manually instead
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleCloseAlert}
      />
    </View>
  );
}
