import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import "../../global.css";

// Hooks & Services
import {
  getWalletBalance,
  updateWalletVisibility,
} from "@/services/walletService";
import { useAuthStore } from "@/store/useAuthStore";

// Assets
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ask from "../../assets/images/icon/Ask.png";
import Businessicon from "../../assets/images/icon/Businessicon.png";
import Coop from "../../assets/images/icon/coop.png";
import FISMPC from "../../assets/images/icon/FISMPC.png";
import Funding from "../../assets/images/icon/Funding.png";
import Intellectual from "../../assets/images/icon/Intellectual.png";
import Licensing from "../../assets/images/icon/Licensing.png";
import Loan from "../../assets/images/icon/Loan.png";
import Lost from "../../assets/images/icon/Lost.png";
import News from "../../assets/images/icon/News.png";
import Product from "../../assets/images/icon/Product.png";
import RD from "../../assets/images/icon/RD.png";
import Suggest from "../../assets/images/icon/Suggest.png";
import image from "../../assets/images/image.png";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [pageLoading, setPageLoading] = useState(true);
  const [balance, setBalance] = useState<string>("0.00");
  const [showBalance, setShowBalance] = useState(false);

  const isMember = user?.user_type_id === 3;

  useEffect(() => {
    const initializeDashboard = async () => {
      if (isMember) {
        try {
          const walletData = await getWalletBalance();
          setBalance(walletData.data.balance);
          setShowBalance(walletData.data.show);
        } catch (error) {
          console.error("Failed to fetch wallet:", error);
        }
      }
      setPageLoading(false);
    };

    initializeDashboard();
  }, [isMember]);

  const handleToggleBalance = async () => {
    const currentState = showBalance;
    setShowBalance(!currentState);

    try {
      // 2. Update the backend
      await updateWalletVisibility();
    } catch (error) {
      console.error("Failed to update visibility on server:", error);
      setShowBalance(currentState);
    }
  };

  const menuItems = [
    { label: "Business Training", href: "/(business)/", source: Businessicon },
    {
      label: "Intellectual Property Assistant",
      href: "/(intellectual)/",
      source: Intellectual,
    },
    { label: "Loan Assistance", href: "../(loan)/", source: Loan },
    {
      label: "Funding & Invest Opportunities",
      href: "/(auth)/login",
      source: Funding,
    },
    {
      label: "Licensing & Permit Assistance",
      href: "/(business)/",
      source: Licensing,
    },
    { label: "R & D Collaboration", href: "/", source: RD },
    { label: "Ask an Expert Assistance", href: "/", source: Ask },
    { label: "FISMPC Online Store", href: "/", source: FISMPC },
    { label: "Product Validation Services", href: "/", source: Product },
    { label: "Lost & Found", href: "/", source: Lost },
    { label: "Suggest a Service", href: "/", source: Suggest },
    { label: "Coop Membership", href: "/", source: Coop },
    { label: "News & Event", href: "/", source: News },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1"
    >
      <View className="flex-1 bg-white items-center">
        <View className="px-6 pt-2 w-full max-w-[500px] mx-auto">
          <View className="items-center">
            {pageLoading ? (
              <Skeleton className="h-10 w-50 rounded-md" />
            ) : (
              <>
                <Text className="text-2xl text-slate-800 text-center">
                  Hello,{" "}
                  <Text className="font-bold">{user?.name || "User"}!</Text>
                </Text>
                <Text className="text-md text-slate-800 text-center">
                  How can we help you today?
                </Text>
              </>
            )}
          </View>

          {/* WALLET SECTION */}
          {isMember && !pageLoading && (
            <View className="bg-primary p-4 mt-5 rounded-xl">
              <View className="flex-row gap-6 justify-between">
                <View className="flex-row gap-3 items-center">
                  <Text className="text-white text-2xl font-bold">
                    ₱{" "}
                    {showBalance
                      ? Number(balance).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "**.**"}
                  </Text>
                  <TouchableOpacity onPress={handleToggleBalance}>
                    <Ionicons
                      name={showBalance ? "eye-off" : "eye"}
                      size={22}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3 items-center">
                  <TouchableOpacity className="bg-white h-10 w-10 flex items-center rounded-lg justify-center">
                    <FontAwesome name="plus" size={24} color="#034194" />
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-white h-10 w-10 flex items-center rounded-lg justify-center">
                    <FontAwesome name="send" size={22} color="#034194" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* BANNER & MENU */}
          <View className="mt-3">
            {pageLoading ? (
              <Skeleton className="!w-full !h-36 rounded-2xl" />
            ) : (
              <Image
                source={image}
                className="!w-full !h-36"
                resizeMode="contain"
              />
            )}
          </View>

          <View className="flex-row flex-wrap max-w-[300px] justify-between mx-auto mt-8 mb-5">
            {pageLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <View key={i} className="!w-[80px] mb-5">
                    <Skeleton className="!w-12 !h-12 mx-auto" />
                    <Skeleton className="text-center h-5 mt-2" />
                  </View>
                ))
              : menuItems.map((item, index) => (
                  <Link key={index} href={item.href as any} className="mb-5">
                    <View className="!w-[80px]">
                      <Image
                        source={item.source}
                        className="!w-12 !h-12 mx-auto"
                      />
                      <Text className="text-center text-sm/4 pt-2">
                        {item.label}
                      </Text>
                    </View>
                  </Link>
                ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
