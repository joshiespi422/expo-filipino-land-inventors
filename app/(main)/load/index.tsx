import { Skeleton } from "@/components/ui/skeleton";
import { getWalletBalance } from "@/services/walletService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../../global.css";

export default function WalletPage() {
  const router = useRouter();

  // STATES
  const [pageLoading, setPageLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // FETCH LIVE WALLET BALANCE
  const fetchWalletData = async () => {
    try {
      setPageLoading(true);
      const response = await getWalletBalance();
      // Handle response structure mapping from ApiWalletResource
      const balanceStr = response?.data?.balance || "0";
      setWalletBalance(parseFloat(balanceStr));
    } catch (err: any) {
      console.error("Failed to load wallet metrics:", err);
      Alert.alert(
        "Error",
        "Could not fetch wallet data. Please check your connection.",
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // FORMAT INPUT
  const handleChange = (value: string) => {
    let raw = value.replace(/[^0-9]/g, "");

    if (raw) {
      setAmount(parseInt(raw).toLocaleString());
    } else {
      setAmount("");
    }
  };

  const cleanAmount = parseFloat(amount.replace(/,/g, "") || "0");

  // VALIDATION AGAINST BACKEND RULES (Min amount rule match: min 10000 cents = ₱100.00)
  const isValid = cleanAmount >= 100;

  // SUBMIT (LOAD WALLET → CHECKOUT)
  const handleProceed = () => {
    if (!isValid) {
      Alert.alert("Invalid Amount", "Minimum load amount is ₱100.00.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      router.push({
        pathname: "/load/checkout",
        params: {
          amount: cleanAmount,
          type: "wallet_load",
        },
      });
    }, 300);
  };

  // LOADING UI
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="items-center py-10 px-6 w-full max-w-[600px] mx-auto">
          <View className="mx-5 pb-10 max-w-[500px] w-full self-center">
            {/* CURRENT BALANCE */}
            <View className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
              <Text className="text-slate-500 text-xs uppercase mb-2">
                Current Wallet Balance
              </Text>
              <Text className="text-primary text-3xl font-bold">
                ₱
                {walletBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            {/* INPUT AMOUNT */}
            <View className="flex-row items-center border-b-2 border-primary w-full py-2 justify-center">
              <Text className="text-primary text-3xl font-bold mr-2">₱</Text>
              <TextInput
                value={amount}
                onChangeText={handleChange}
                keyboardType="numeric"
                placeholder="Enter load amount"
                className="text-primary text-3xl font-bold flex-1"
              />
            </View>

            <Text className="p-1 text-xs text-slate-400 mt-1">
              Minimum load is ₱100.00 (Processed via secure gateway)
            </Text>

            {/* SUMMARY */}
            <View className="mt-8 border border-slate-200 rounded-xl p-4 bg-white">
              <Text className="text-xs text-slate-500 mb-2">Load Summary</Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-600">Load Amount</Text>
                <Text className="font-bold text-primary">
                  ₱{cleanAmount.toLocaleString() || "0.00"}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-slate-600">New Balance After Load</Text>
                <Text className="font-bold">
                  ₱
                  {(walletBalance + cleanAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleProceed}
          disabled={!isValid || isProcessing}
          className={`h-16 rounded-2xl justify-center items-center ${
            !isValid || isProcessing ? "bg-slate-300" : "bg-primary"
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Proceed to Payment
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
