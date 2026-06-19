import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

import UserProfile from "../../assets/images/UserProfile.jpg";

const chatList = [
  {
    id: "1",
    name: "Fashion Store",
    message: "Yes, it is! We still have stocks available.",
    time: "10:33 AM",
    unread: 2,
    online: true,
    avatar: UserProfile,
  },

  {
    id: "2",
    name: "Tech Gadget Shop",
    message: "Your order has been shipped.",
    time: "Yesterday",
    unread: 0,
    online: true,
    avatar: UserProfile,
  },

  {
    id: "3",
    name: "Beauty Essentials",
    message: "Thank you for your purchase!",
    time: "Monday",
    unread: 5,
    online: false,
    avatar: UserProfile,
  },
];

export default function ChatList() {
  const router = useRouter();

  const openChat = (id: string) => {
    router.push({
      pathname: "/chat-seller",
      params: {
        id,
      },
    });
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}

      <View className="bg-white px-4 py-4 border-b border-slate-200">
        <View className="flex-row items-center">
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={28}
            color="#034194"
          />

          <Text className="ml-3 text-xl font-bold text-primary">Messages</Text>
        </View>
      </View>

      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 12,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openChat(item.id)}
            className="bg-white rounded-2xl p-3 mb-3 flex-row items-center border border-slate-100"
          >
            {/* Avatar */}

            <View className="relative">
              <Image
                source={item.avatar}
                style={{
                  width: 55,
                  height: 55,
                  borderRadius: 100,
                }}
              />

              {item.online && (
                <View className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

            {/* Content */}

            <View className="flex-1 ml-3">
              <View className="flex-row justify-between">
                <Text className="font-semibold text-base text-slate-800">
                  {item.name}
                </Text>

                <Text className="text-xs text-slate-400">{item.time}</Text>
              </View>

              <View className="flex-row justify-between items-center mt-1">
                <Text
                  numberOfLines={1}
                  className="text-sm text-slate-500 flex-1"
                >
                  {item.message}
                </Text>

                {item.unread > 0 && (
                  <View className="ml-2 bg-red-500 min-w-[20px] h-[20px] rounded-full items-center justify-center px-1">
                    <Text className="text-white text-xs font-bold">
                      {item.unread}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
