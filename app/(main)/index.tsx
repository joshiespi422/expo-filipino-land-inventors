import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

// Hooks & Services
import { profileService } from "@/services/profileService";
import {
  getWalletBalance,
  updateWalletVisibility,
} from "@/services/walletService";
import { useAuthStore } from "@/store/useAuthStore";

// Assets
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AlertIcon from "../../assets/images/icon/alert.png"; // New Alert Asset
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

const { width } = Dimensions.get("window");

export default function DashboardPage() {
  const { user, setUser } = useAuthStore(); // Added setUser
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [showBalance, setShowBalance] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [pendingFeature, setPendingFeature] = useState("");

  const isMember = user?.user_type_id === 3;

  // 1. Create a centralized data fetching function
  const loadData = async (showLoading = false) => {
    if (showLoading) setPageLoading(true);

    try {
      // First, fetch the latest profile to see if status changed from Basic to Member
      const userData = await profileService.getProfile();
      setUser(userData); // Update global store

      // If they are now a member (or were already), fetch the wallet
      if (userData?.user_type_id === 3) {
        const walletData = await getWalletBalance();
        setBalance(walletData.data.balance);
        setShowBalance(walletData.data.show);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setPageLoading(false);
    }
  };

  // 2. Initial Load: Watch the user object
  useEffect(() => {
    loadData(true);
  }, []); // Run once on mount

  // 3. Updated onRefresh: Now refreshes Profile AND Wallet
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  }, []);

  const handleToggleBalance = async () => {
    const currentState = showBalance;
    setShowBalance(!currentState);
    try {
      await updateWalletVisibility();
    } catch (error) {
      setShowBalance(currentState);
    }
  };

  const handleMenuPress = (item: any) => {
    // We check the latest isMember status derived from the updated user object
    if (!isMember) {
      setPendingFeature(item.label);
      setShowAlert(true);
    } else {
      router.push(item.href as any);
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
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#034194"]}
          tintColor="#034194"
        />
      }
    >
      <View className="px-6 pt-4 w-full max-w-[600px] mx-auto">
        {/* 1. WELCOME TEXT */}
        <View className="items-center mb-4">
          {pageLoading ? (
            <Skeleton className="h-8 w-40 rounded-md" />
          ) : (
            <>
              <Text className="text-2xl text-slate-800 text-center">
                Hello,{" "}
                <Text className="font-bold">{user?.name || "User"}!</Text>
              </Text>
              <Text className="text-md text-slate-500 text-center">
                How can we help you today?
              </Text>
            </>
          )}
        </View>

        {/* 2. WALLET SECTION */}
        {isMember && !pageLoading && (
          <View className="bg-primary p-3 rounded-2xl shadow-lg mb-4">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <Text className="text-white text-2xl font-bold">
                  ₱{" "}
                  {showBalance
                    ? Number(balance).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })
                    : "**.**"}
                </Text>
                <TouchableOpacity onPress={handleToggleBalance}>
                  <Ionicons
                    name={showBalance ? "eye-off" : "eye"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity className="bg-white h-10 w-10 flex justify-center items-center rounded-lg">
                  <FontAwesome name="plus" size={22} color="#034194" />
                </TouchableOpacity>
                <TouchableOpacity className="bg-white h-10 w-10 flex justify-center items-center rounded-lg">
                  <FontAwesome name="send" size={20} color="#034194" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 3. BANNER */}
        <View className="mb-6">
          {pageLoading ? (
            <Skeleton className="w-full h-36 rounded-2xl" />
          ) : (
            <Image
              source={image}
              className="w-full h-36 rounded-2xl"
              resizeMode="cover"
            />
          )}
        </View>

        {/* 4. RESPONSIVE GRID MENU (3 Per Row) */}
        <View className="flex-row flex-wrap justify-between">
          {pageLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <View key={i} className="w-[30%] items-center mb-8">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <Skeleton className="w-20 h-4 mt-2" />
                </View>
              ))
            : menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleMenuPress(item)}
                  className="w-[30%] items-center mb-8"
                >
                  <View className="rounded-3xl mb-3 items-center justify-center">
                    <Image
                      source={item.source}
                      className="w-12 h-12"
                      resizeMode="contain"
                    />
                  </View>
                  <Text className="text-center text-sm font-medium text-slate-700">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showAlert}
        statusBarTranslucent={true}
        onRequestClose={() => setShowAlert(false)}
      >
        {/* THIS is the important fix */}
        <View className="flex-1 bg-black/20">
          <View className="flex-1 justify-center items-center px-5">
            <View className="bg-white p-5 rounded-[30px] items-center w-full max-w-[380px] shadow-2xl">
              <Image source={AlertIcon} className="w-20 h-20 mb-4" />

              <Text className="text-xl font-bold text-primary text-center mb-2">
                Account Completion Required
              </Text>

              <Text className="text-slate-500 text-center mb-6 leading-5 px-2">
                To access{" "}
                <Text className="font-bold text-slate-800">
                  {pendingFeature}
                </Text>{" "}
                feature, you must first complete your account information.
              </Text>

              <View className="w-full gap-y-3">
                {/* Action Button: Go to Profile */}
                <TouchableOpacity
                  onPress={() => {
                    setShowAlert(false);
                    router.push("/profile"); // Directs to Profile
                  }}
                  className="bg-primary w-full py-4 rounded-2xl active:opacity-90 shadow-md shadow-primary/30"
                >
                  <Text className="text-white text-center font-bold text-lg">
                    View Profile
                  </Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => setShowAlert(false)}
                  className="w-full py-4 rounded-2xl bg-gray-200 active:opacity-90"
                >
                  <Text className="text-slate-500 text-center font-bold text-lg">
                    Maybe Later
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
