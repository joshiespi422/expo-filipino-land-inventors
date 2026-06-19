import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

// Static Notifications Mock Database
const STATIC_NOTIFICATIONS = [
  {
    id: "1",
    title: "⚡ Flash Sale Alert!",
    description:
      "Items in your favorites are up to 50% off for the next 2 hours. Don't miss out!",
    timestamp: "2 mins ago",
    type: "promo",
    isRead: false,
  },
  {
    id: "2",
    title: "📦 Order Shipped Successfully",
    description:
      "Your package containing your recent tech haul has been handed over to our courier.",
    timestamp: "1 hour ago",
    type: "update",
    isRead: false,
  },
  {
    id: "3",
    title: "🎟️ $10 Voucher Received!",
    description:
      "Claim your exclusive weekend shopper discount code: WEEKEND10 at checkout.",
    timestamp: "5 hours ago",
    type: "promo",
    isRead: true,
  },
  {
    id: "4",
    title: "🔧 System Maintenance Notice",
    description:
      "We are updating our payment gateways tonight at 12:00 AM. Expect short delays.",
    timestamp: "1 day ago",
    type: "update",
    isRead: true,
  },
];

const notificationTabs = ["All", "Promos", "Updates"];

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("All");

  // Filter listings completely statically based on current selected tab state
  const filteredNotifications = STATIC_NOTIFICATIONS.filter((notif) => {
    if (selectedTab === "Promos") return notif.type === "promo";
    if (selectedTab === "Updates") return notif.type === "update";
    return true;
  });

  return (
    <View className="flex-1 bg-slate-100">
      {/* FIXED HEADER */}
      <View className="bg-white pt-3 pb-1 px-4 flex-row items-center justify-between border-b border-slate-200">
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-slate-800">
            Notifications
          </Text>
          <Text className="text-xs text-white ml-2 bg-[#D70127] px-2 py-0.5 rounded-full font-semibold">
            2 New
          </Text>
        </View>

        <TouchableOpacity className="py-2 px-1">
          <Text className="text-xs font-semibold text-[#034194]">
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL CATEGORY SUB-TABS */}
      <View className="bg-white border-b border-slate-200">
        <FlatList
          horizontal
          data={notificationTabs}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const isActive = selectedTab === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedTab(item)}
                className={`mr-2 px-5 py-1.5 rounded-full border ${
                  isActive
                    ? "bg-[#034194] border-[#034194]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text
                  className={`font-medium text-xs ${
                    isActive ? "text-white" : "text-slate-600"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* STATIC NOTIFICATIONS LIST */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`flex-row items-start p-4 border-b border-slate-100 ${
              item.isRead ? "bg-white" : "bg-blue-50/60"
            }`}
          >
            {/* Visual Icon Indicators */}
            <View
              className={`p-2.5 rounded-full mr-3 ${
                item.type === "promo" ? "bg-amber-100" : "bg-blue-100"
              }`}
            >
              <Ionicons
                name={
                  item.type === "promo"
                    ? "gift-outline"
                    : "notifications-outline"
                }
                size={20}
                color={item.type === "promo" ? "#d97706" : "#2563eb"}
              />
            </View>

            {/* Content Text Details */}
            <View className="flex-1 pr-2">
              <View className="flex-row justify-between items-start mb-0.5">
                <Text
                  className={`text-sm flex-1 mr-2 ${
                    item.isRead
                      ? "font-medium text-slate-800"
                      : "font-bold text-slate-900"
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {item.timestamp}
                </Text>
              </View>
              <Text
                className={`text-xs leading-4 ${
                  item.isRead ? "text-slate-500" : "text-slate-600 font-medium"
                }`}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            </View>

            {/* Unread Active Badge Dot Indicator */}
            {!item.isRead && (
              <View className="w-2 h-2 rounded-full bg-[#034194] self-center ml-1" />
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            {filteredNotifications.length === 0 && (
              <View className="items-center justify-center py-24">
                <View className="bg-slate-200 p-4 rounded-full mb-3">
                  <Ionicons
                    name="notifications-off-outline"
                    size={40}
                    color="#94a3b8"
                  />
                </View>
                <Text className="text-slate-500 font-semibold text-base">
                  All caught up!
                </Text>
                <Text className="text-slate-400 text-xs text-center px-12 mt-1 leading-4">
                  There are no alerts or promotional updates found under this
                  category tab right now.
                </Text>
              </View>
            )}
          </>
        }
      />
    </View>
  );
}
