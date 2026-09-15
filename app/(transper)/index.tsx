import { Skeleton } from "@/components/ui/skeleton";
import { getWalletBalance } from "@/services/walletService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";

const MIN_TRANSFER = 1.0;

const CHANNELS = [
  { id: "gcash", name: "GCash", category: "E-Wallet" },
  { id: "maya", name: "Maya", category: "E-Wallet" },
  { id: "bdo", name: "BDO Unibank", category: "Bank" },
  { id: "bpi", name: "BPI", category: "Bank" },
  { id: "landbank", name: "LandBank", category: "Bank" },
  { id: "metrobank", name: "Metrobank", category: "Bank" },
  { id: "unionbank", name: "UnionBank", category: "Bank" },
];

const PURPOSES = [
  "Personal Transfer",
  "Bills Payment",
  "Family Support",
  "Services / Work",
  "Others",
];

export default function TransferPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pageLoading, setPageLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  // Form Fields
  const [transferMode, setTransferMode] = useState<"manual" | "qr">("manual");
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [remarks, setRemarks] = useState("");

  // Modals
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);

  const fetchWalletData = async () => {
    try {
      setPageLoading(true);
      const response = await getWalletBalance();
      const balanceStr = response?.data?.balance || "0";
      setWalletBalance(parseFloat(balanceStr));
    } catch (err) {
      console.error("Failed to load wallet metrics:", err);
      Alert.alert("Error", "Could not fetch wallet data.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleAmountChange = (value: string) => {
    let raw = value.replace(/[^0-9]/g, "");
    if (raw) {
      setAmount(parseInt(raw).toLocaleString());
    } else {
      setAmount("");
    }
  };

  const cleanAmount = parseFloat(amount.replace(/,/g, "") || "0");

  const isValid =
    cleanAmount >= MIN_TRANSFER &&
    cleanAmount <= walletBalance &&
    (transferMode === "qr" ||
      (accountName.trim() !== "" && accountNumber.trim() !== ""));

  const handleContinue = () => {
    if (!isValid) return;

    router.push({
      pathname: "/review",
      params: {
        amount: cleanAmount,
        channelId: selectedChannel.id,
        channelName: selectedChannel.name,
        recipientName:
          transferMode === "qr" ? "QR Scanned Account" : accountName,
        recipientNumber:
          transferMode === "qr" ? "Scanned via QR" : accountNumber,
        transferMode,
        purpose,
        remarks,
      },
    });
  };

  if (pageLoading) {
    return (
      <View className="flex-1 bg-white p-5 pt-20">
        <Skeleton className="h-10 w-3/4 self-center mb-4" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <View className="items-center py-8 px-6 w-full max-w-[600px] mx-auto">
          <View className="w-full max-w-[500px]">
            {/* AVAILABLE BALANCE */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5">
              <Text className="text-slate-500 text-xs uppercase mb-1">
                Available Balance
              </Text>
              <Text className="text-primary text-3xl font-bold">
                ₱
                {walletBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* TRANSFER MODE TOGGLE */}
            <View className="flex-row bg-slate-100 rounded-xl p-1 mb-5">
              <TouchableOpacity
                onPress={() => setTransferMode("manual")}
                className={`flex-1 py-3 rounded-lg items-center ${
                  transferMode === "manual" ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`font-bold text-sm ${
                    transferMode === "manual"
                      ? "text-primary"
                      : "text-slate-400"
                  }`}
                >
                  Account No.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTransferMode("qr")}
                className={`flex-1 py-3 rounded-lg items-center ${
                  transferMode === "qr" ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`font-bold text-sm ${
                    transferMode === "qr" ? "text-primary" : "text-slate-400"
                  }`}
                >
                  Transfer via QR
                </Text>
              </TouchableOpacity>
            </View>

            {/* TRANSFER DETAILS FORM */}
            {transferMode === "qr" ? (
              <View className="border border-slate-200 bg-slate-50 rounded-xl p-6 items-center mb-5">
                <Text className="text-slate-700 font-bold mb-1">
                  Scan Recipient QR
                </Text>
                <Text className="text-slate-400 text-xs text-center mb-4">
                  Upload or scan an InstaPay / QR Ph code
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "QR Scanner",
                      "Trigger camera / QR scanner here.",
                    )
                  }
                  className="bg-primary px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">
                    Open Camera / Scan
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-y-4 mb-5">
                {/* BANK / E-WALLET PICKER */}
                <View>
                  <Text className="text-slate-600 text-xs font-bold mb-1">
                    Bank / E-Wallet
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowChannelModal(true)}
                    className="border border-slate-200 rounded-xl p-4 bg-white flex-row justify-between items-center"
                  >
                    <Text className="text-slate-800 font-bold">
                      {selectedChannel.name}
                    </Text>
                    <Text className="text-slate-400 text-xs">
                      Tap to change
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ACCOUNT NAME */}
                <View>
                  <Text className="text-slate-600 text-xs font-bold mb-1">
                    Account Name
                  </Text>
                  <TextInput
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="e.g. Juan Dela Cruz"
                    className="border border-slate-200 rounded-xl p-4 text-slate-800 bg-white"
                  />
                </View>

                {/* ACCOUNT NUMBER */}
                <View>
                  <Text className="text-slate-600 text-xs font-bold mb-1">
                    Account / Mobile Number
                  </Text>
                  <TextInput
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                    placeholder="e.g. 09123456789"
                    className="border border-slate-200 rounded-xl p-4 text-slate-800 bg-white"
                  />
                </View>
              </View>
            )}

            {/* AMOUNT INPUT */}
            <View className="mb-4">
              <Text className="text-slate-600 text-xs font-bold mb-1">
                Amount
              </Text>
              <View className="flex-row items-center border border-slate-200 rounded-xl px-4 bg-white">
                <Text className="text-primary text-xl font-bold mr-2">₱</Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="0.00"
                  className="text-slate-800 text-xl font-bold py-3 flex-1"
                />
              </View>
              {cleanAmount > walletBalance ? (
                <Text className="text-xs text-red-500 mt-1">
                  Exceeds available balance
                </Text>
              ) : (
                <Text className="text-xs text-slate-400 mt-1">
                  Minimum transfer is ₱{MIN_TRANSFER.toLocaleString()}.00
                </Text>
              )}
            </View>

            {/* PURPOSE PICKER */}
            <View className="mb-4">
              <Text className="text-slate-600 text-xs font-bold mb-1">
                Purpose (Optional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowPurposeModal(true)}
                className="border border-slate-200 rounded-xl p-4 bg-white flex-row justify-between items-center"
              >
                <Text className="text-slate-800">{purpose}</Text>
                <Text className="text-slate-400 text-xs">Select</Text>
              </TouchableOpacity>
            </View>

            {/* REMARKS */}
            <View>
              <Text className="text-slate-600 text-xs font-bold mb-1">
                Remarks (Optional)
              </Text>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add a note or message"
                className="border border-slate-200 rounded-xl p-4 text-slate-800 bg-white"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid}
          className={`h-14 rounded-xl justify-center items-center ${
            !isValid ? "bg-slate-300" : "bg-primary"
          }`}
        >
          <Text className="text-white font-bold text-lg">Continue</Text>
        </TouchableOpacity>
      </View>

      {/* BANK / WALLET MODAL */}
      <Modal
        visible={showChannelModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View
            className="bg-white rounded-t-2xl p-5 max-h-[70%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <Text className="font-bold text-lg mb-4">
              Select Bank or E-Wallet
            </Text>
            <ScrollView>
              {CHANNELS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setSelectedChannel(item);
                    setShowChannelModal(false);
                  }}
                  className="py-3 border-b border-slate-100 flex-row justify-between items-center"
                >
                  <Text className="font-bold text-slate-800">{item.name}</Text>
                  <Text className="text-xs text-slate-400">
                    {item.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowChannelModal(false)}
              className="mt-4 p-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="font-bold text-slate-600">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PURPOSE MODAL */}
      <Modal
        visible={showPurposeModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View
            className="bg-white rounded-t-2xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <Text className="font-bold text-lg mb-4">Select Purpose</Text>
            {PURPOSES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setPurpose(item);
                  setShowPurposeModal(false);
                }}
                className="py-3 border-b border-slate-100"
              >
                <Text className="text-slate-800">{item}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowPurposeModal(false)}
              className="mt-4 p-3 bg-slate-100 rounded-xl items-center"
            >
              <Text className="font-bold text-slate-600">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
