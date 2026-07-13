import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "@/services/api";
import echo from "@/services/echo";
// Import your official types directly
import {
  ConversationData,
  markConversationAsRead,
} from "@/services/chatService";

// Extend the backend type to include your frontend presentation properties safely
interface UIConversation extends ConversationData {
  created_at?: string;
  updated_at?: string;
  display_name: string;
  last_message: string;
  unread_count: number;
}

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const totalUnreadCount = conversations.reduce(
    (acc, item) => acc + (item.unread_count || 0),
    0,
  );

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const profileRes = await api.get("/profile");
      const rawUser = profileRes.data?.data;
      const uid = rawUser?.id || profileRes.data?.id;
      if (uid) setCurrentUserId(uid);

      await fetchConversationsList(uid);
    } catch (err) {
      console.error("❌ Error initializing chat list screen maps:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationsList = async (userIdFilter?: number | null) => {
    try {
      const res = await api.get("/conversations");
      const rawList = res.data?.data || res.data || [];

      const targetUid = userIdFilter || currentUserId;

      const normalized: UIConversation[] = rawList.map((convo: any) => {
        // Find opposing peer context inside participants list
        const peer = convo.participants?.find(
          (p: any) => p.user_id !== targetUid,
        )?.user;

        const myPivot = convo.participants?.find(
          (p: any) => p.user_id === targetUid,
        );

        // Sort messages safely to locate the absolute newest one
        const sortedMessages = convo.messages
          ? [...convo.messages].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
          : [];

        const latestMsg = sortedMessages[0];

        // Safely extract fallback timestamps from the raw payload
        const baseTimestamp =
          convo.updated_at || convo.created_at || new Date().toISOString();

        // Calculate unread count dynamically if not provided by backend
        let calculatedUnread = convo.unread_count ?? 0;
        if (myPivot && convo.messages) {
          const lastReadTime = myPivot.last_read_at
            ? new Date(myPivot.last_read_at).getTime()
            : 0;
          calculatedUnread = convo.messages.filter(
            (m: any) =>
              m.sender_id !== targetUid &&
              new Date(m.created_at).getTime() > lastReadTime,
          ).length;
        }

        return {
          ...convo,
          display_name: peer?.name || "Support Representative",
          last_message: latestMsg
            ? latestMsg.body || "Sent an attachment"
            : "No messages yet",
          unread_count: calculatedUnread,
          // Fixed: Fall back safely to base timestamp values if no messages exist yet
          updated_at: latestMsg ? latestMsg.created_at : baseTimestamp,
        };
      });

      // Sort recent interactions to the top chronologically
      normalized.sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() -
          new Date(a.updated_at || 0).getTime(),
      );

      setConversations(normalized);
    } catch (err) {
      console.error(
        "❌ Failed to resolve conversation collection records:",
        err,
      );
    }
  };

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    await fetchConversationsList(currentUserId);
    setRefreshing(false);
  };

  // Real-time notification socket listener code
  useEffect(() => {
    if (!currentUserId || !echo) return;

    const userNotificationChannel = `App.Models.User.${currentUserId}`;

    echo.private(userNotificationChannel).notification((payload: any) => {
      setConversations((prevList) => {
        const targetConvoId = Number(payload.conversation_id);

        return prevList
          .map((c) => {
            if (c.id === targetConvoId) {
              return {
                ...c,
                last_message: payload.body || "Sent an attachment",
                unread_count: (c.unread_count || 0) + 1,
                updated_at: new Date().toISOString(),
              };
            }
            return c;
          })
          .sort(
            (a, b) =>
              new Date(b.updated_at || 0).getTime() -
              new Date(a.updated_at || 0).getTime(),
          );
      });
    });

    return () => {
      if (echo) {
        echo.leave(userNotificationChannel);
      }
    };
  }, [currentUserId]);

  const openConversationRoom = async (selectedConvo: UIConversation) => {
    // Clear notifications locally for instant visual feedback
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvo.id ? { ...c, unread_count: 0 } : c,
      ),
    );

    try {
      // Used your imported markConversationAsRead function here!
      await markConversationAsRead(selectedConvo.id);
    } catch (readErr) {
      console.error(
        "❌ Failed pushing message receipt acknowledgment to database:",
        readErr,
      );
    }

    router.push({
      pathname: "/chat-intellectual",
      params: {
        conversationId: selectedConvo.id,
        title: selectedConvo.display_name,
      },
    });
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return "";
    const stamp = new Date(isoString);
    return stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderConversationCard = ({ item }: { item: UIConversation }) => {
    const isUnread = item.unread_count > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => openConversationRoom(item)}
        className="flex-row items-center bg-white px-4 py-3.5 border-b border-slate-100"
      >
        <View className="flex-1 ml-3.5 pr-1">
          <View className="flex-row justify-between items-baseline">
            <Text
              numberOfLines={1}
              className={`text-slate-900 text-[15px] ${isUnread ? "font-bold text-slate-950" : "font-semibold"}`}
            >
              {item.display_name}
            </Text>
            <Text className="text-xs text-slate-400 font-medium">
              {formatMessageTime(item.updated_at || item.created_at)}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            className={`text-sm mt-0.5 ${isUnread ? "text-slate-900 font-bold" : "text-slate-500"}`}
          >
            {item.last_message}
          </Text>
        </View>

        {isUnread && (
          <View className="bg-[#D70127] min-w-[20px] h-5 rounded-full items-center justify-center px-1.5 ml-2">
            <Text className="text-white font-extrabold text-[11px] text-center">
              {item.unread_count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-slate-200">
        <View className="flex-row items-center">
          <Ionicons name="chatbubbles" size={22} color="#034194" />
          <Text className="text-base font-bold text-slate-800 ml-2">
            Conversations
          </Text>

          {totalUnreadCount > 0 && (
            <View className="bg-[#D70127] px-2 py-0.5 rounded-full ml-2">
              <Text className="text-white text-[11px] font-extrabold">
                {totalUnreadCount} Active
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => handlePullToRefresh()}
          className="p-1.5 rounded-full active:bg-slate-100"
        >
          <Ionicons name="refresh" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#034194" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversationCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullToRefresh}
              colors={["#034194"]}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 px-8">
              <View className="bg-slate-100 p-4 rounded-full mb-3.5">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={36}
                  color="#94A3B8"
                />
              </View>
              <Text className="text-slate-800 font-bold text-base">
                No support history
              </Text>
              <Text className="text-slate-400 text-sm text-center mt-1.5 leading-5">
                Your conversations with our assistance teams regarding
                intellectual property tracking will be tracked here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
