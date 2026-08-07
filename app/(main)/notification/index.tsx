import {
  getNotifications,
  markNotificationAsRead,
  NotificationItem,
} from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const notificationTabs = ["All", "Unread"];

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("All");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Helper function to map notification types to Ionicons & Colors
  const getNotificationIcon = (type: string) => {
    if (type.includes("approved") || type.includes("payment")) {
      return {
        name: "card-outline" as const,
        bg: "bg-emerald-100",
        color: "#059669",
      };
    }
    if (type.includes("registered") || type.includes("success")) {
      return {
        name: "checkmark-circle-outline" as const,
        bg: "bg-blue-100",
        color: "#2563eb",
      };
    }
    if (type.includes("declined") || type.includes("rejected")) {
      return {
        name: "close-circle-outline" as const,
        bg: "bg-rose-100",
        color: "#e11d48",
      };
    }
    return {
      name: "notifications-outline" as const,
      bg: "bg-amber-100",
      color: "#d97706",
    };
  };

  const handlePressNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      markNotificationAsRead(item.id).catch(console.error);
    }

    if (item.route) {
      try {
        console.log("📍 [Notification] Original route:", item.route);

        // Split path and query parameters safely
        const [rawPath, queryString] = item.route.split("?");

        // Ensure leading slash for Expo Router
        const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
        console.log("📍 [Notification] Clean path:", cleanPath);

        const params: Record<string, string> = {};
        if (queryString) {
          const urlParams = new URLSearchParams(queryString);
          urlParams.forEach((val, key) => {
            params[key] = val;
          });
        }

        // Add navigation origin context
        params.from = "notification";
        console.log("📍 [Notification] Final params:", params);

        router.push({
          pathname: cleanPath as any,
          params: params,
        });
      } catch (err) {
        console.error("❌ Failed to parse and push notification route:", err);
      }
    }
  };

  // Filter based on tab selection
  const filteredNotifications = notifications.filter((notif) => {
    if (selectedTab === "Unread") return !notif.isRead;
    return true;
  });

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-100 justify-center items-center">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      {/* Category Tabs */}
      <View className="flex-row bg-white border-b border-slate-200 px-4 py-2">
        {notificationTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedTab === tab ? "bg-[#034194]" : "bg-slate-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedTab === tab ? "text-white" : "text-slate-600"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const iconInfo = getNotificationIcon(item.type);

          return (
            <TouchableOpacity
              onPress={() => handlePressNotification(item)}
              className={`flex-row items-start p-4 border-b border-slate-100 ${
                item.isRead ? "bg-white" : "bg-blue-50/60"
              }`}
            >
              {/* Dynamic Icon Indicator */}
              <View className={`p-2.5 rounded-full mr-3 ${iconInfo.bg}`}>
                <Ionicons
                  name={iconInfo.name}
                  size={20}
                  color={iconInfo.color}
                />
              </View>

              {/* Text Details */}
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
                  {/* <Text>{item.route}</Text> */}
                  <Text className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {item.timestamp}
                  </Text>
                </View>

                <Text
                  className={`text-xs leading-4 ${
                    item.isRead
                      ? "text-slate-500"
                      : "text-slate-600 font-medium"
                  }`}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              </View>

              {/* Unread Indicator Dot */}
              {!item.isRead && (
                <View className="w-2 h-2 rounded-full bg-[#034194] self-center ml-1" />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
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
              There are no notifications found right now.
            </Text>
          </View>
        }
      />
    </View>
  );
}
