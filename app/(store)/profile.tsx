import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import UserProfile from "../../assets/images/UserProfile.jpg";

export default function BuyerProfile() {
  const router = useRouter();

  // Static mock calculations for tracking notification badges matching your data layer
  const orderBadges = {
    toPay: 0,
    toShip: 1,
    toReceive: 1,
    toRate: 2,
  };

  // Navigates directly to your order list layout while forcing the correct filter selection
  const handleTrackOrderPress = (statusFilter: string) => {
    router.push({
      pathname: "/order-list",
      params: { status: statusFilter },
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
    >
      {/* PROFILE CARD HEADER CONTAINER */}
      <View className="mx-4 bg-blue rounded-3xl my-5 p-5 border border-slate-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-primary text-lg font-bold tracking-tight">
            My Account
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/notification")}
          >
            <Ionicons name="settings-outline" size={22} color="#034194" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mt-1">
          <Image
            source={UserProfile}
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              borderWidth: 3,
            }}
            className="border-primary"
          />
          <View className="ml-4 flex-1">
            <Text className="text-primary text-xl font-bold tracking-tight">
              Juan Dela Cruz
            </Text>
            <Text className="text-slate-500 text-xs">@juan_delacruz</Text>
            <View className="bg-primary self-start px-2 py-1 rounded-2xl mt-3">
              <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                Gold Member
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* TRACKING ORDER STATES LAYER */}
      <View className="mx-4 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <View className="flex-row justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <Text className="font-bold text-slate-800 text-base tracking-tight">
            My Purchases
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center"
            onPress={() => handleTrackOrderPress("All")}
          >
            <Text className="text-xs text-slate-400 font-medium mr-1">
              View Order History
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center px-1">
          {/* TO PAY SELECTION */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleTrackOrderPress("To Pay")}
            className="items-center justify-center w-16 relative"
          >
            <Ionicons name="wallet-outline" size={24} color="#034194" />
            <Text className="text-[11px] text-slate-600 font-medium mt-2 text-center">
              To Pay
            </Text>
            {orderBadges.toPay > 0 && (
              <View className="absolute -top-1 right-1 bg-[#D70127] rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 border border-white">
                <Text className="text-white text-[9px] font-bold">
                  {orderBadges.toPay}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* TO SHIP SELECTION */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleTrackOrderPress("To Ship")}
            className="items-center justify-center w-16 relative"
          >
            <Ionicons name="cube-outline" size={24} color="#034194" />
            <Text className="text-[11px] text-slate-600 font-medium mt-2 text-center">
              To Ship
            </Text>
            {orderBadges.toShip > 0 && (
              <View className="absolute -top-1 right-1 bg-[#D70127] rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 border border-white">
                <Text className="text-white text-[9px] font-bold">
                  {orderBadges.toShip}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* TO RECEIVE SELECTION */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleTrackOrderPress("To Receive")}
            className="items-center justify-center w-16 relative"
          >
            <Ionicons name="airplane-outline" size={24} color="#034194" />
            <Text className="text-[11px] text-slate-600 font-medium mt-2 text-center">
              To Receive
            </Text>
            {orderBadges.toReceive > 0 && (
              <View className="absolute -top-1 right-1 bg-[#D70127] rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 border border-white">
                <Text className="text-white text-[9px] font-bold">
                  {orderBadges.toReceive}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* TO RATE SELECTION */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleTrackOrderPress("Completed")}
            className="items-center justify-center w-16 relative"
          >
            <Ionicons name="star-outline" size={24} color="#034194" />
            <Text className="text-[11px] text-slate-600 font-medium mt-2 text-center">
              To Rate
            </Text>
            {orderBadges.toRate > 0 && (
              <View className="absolute -top-1 right-1 bg-[#D70127] rounded-full min-w-[16px] h-[16px] items-center justify-center px-1 border border-white">
                <Text className="text-white text-[9px] font-bold">
                  {orderBadges.toRate}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ACCOUNT MANAGE SECTIONS LIST */}
      <View className="mx-4 bg-white rounded-3xl p-2 mt-4 border border-slate-100 shadow-sm mb-6">
        <TouchableOpacity
          activeOpacity={0.6}
          className="flex-row items-center justify-between p-4 border-b border-slate-50"
        >
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={20} color="#034194" />
            <Text className="ml-3 text-slate-700 font-medium">
              Shipping Address
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.6}
          className="flex-row items-center justify-between p-4 border-b border-slate-50"
        >
          <View className="flex-row items-center">
            <Ionicons name="card-outline" size={20} color="#034194" />
            <Text className="ml-3 text-slate-700 font-medium">
              Payment Methods
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.6}
          className="flex-row items-center justify-between p-4"
        >
          <View className="flex-row items-center">
            <Ionicons name="help-circle-outline" size={20} color="#034194" />
            <Text className="ml-3 text-slate-700 font-medium">Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
