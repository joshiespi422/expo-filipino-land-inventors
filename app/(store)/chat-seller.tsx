import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import UserProfile from "../../assets/images/UserProfile.jpg";

const SELLER_INFO = {
  name: "Fashion Store",
  status: "Online",
  avatar: UserProfile,
};

export default function ChatSeller() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hi there! Welcome to Fashion Store. How can we help you today?",
      sender: "seller",
      time: "10:30 AM",
    },
    {
      id: "2",
      text: "Hello! Is the Premium T-Shirt Oversized Cotton Casual Wear still available?",
      sender: "user",
      time: "10:32 AM",
    },
    {
      id: "3",
      text: "Yes, it is! We still have stocks available.",
      sender: "seller",
      time: "10:33 AM",
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showEmojis, showActions]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <View className="flex-1 bg-white">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <View className="relative">
            <Image
              source={SELLER_INFO.avatar}
              style={{
                width: 40,
                height: 40,
                borderRadius: 100,
              }}
            />

            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </View>

          <View className="ml-3">
            <Text className="font-semibold text-lg text-primary">
              {SELLER_INFO.name}
            </Text>

            <Text className="text-xs text-slate-400">{SELLER_INFO.status}</Text>
          </View>
        </View>

        <View className="flex-row gap-4">
          <Ionicons name="call-outline" size={22} color="#475569" />

          <Ionicons name="ellipsis-vertical" size={22} color="#475569" />
        </View>
      </View>

      {/* KEYBOARD AREA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        className="flex-1"
      >
        {/* MESSAGES */}

        <ScrollView
          ref={scrollViewRef}
          className="flex-1 bg-slate-50 px-4"
          contentContainerStyle={{
            paddingVertical: 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <View
                key={msg.id}
                className={`flex-row mb-4 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <Image
                    source={SELLER_INFO.avatar}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 100,
                    }}
                    className="mr-2"
                  />
                )}

                <View className="max-w-[75%]">
                  <View
                    className={`p-3 rounded-2xl ${
                      isUser
                        ? "bg-primary rounded-tr-none"
                        : "bg-white border border-slate-100 rounded-tl-none"
                    }`}
                  >
                    <Text
                      className={`text-[15px] ${
                        isUser ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {msg.text}
                    </Text>
                  </View>

                  <Text className="text-[10px] text-slate-400 mt-1">
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* FOOTER */}

        <View className="border-t border-slate-100 bg-white px-3 py-3">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                setShowActions(!showActions);
                setShowEmojis(false);
              }}
              className="bg-slate-100 p-2 rounded-full"
            >
              <Ionicons name="add-outline" size={22} color="#475569" />
            </TouchableOpacity>

            <View className="flex-1 bg-slate-100 rounded-2xl px-4 flex-row items-center">
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                multiline
                onFocus={() => {
                  setShowActions(false);
                  setShowEmojis(false);
                }}
                className="flex-1 text-[15px] max-h-20"
              />

              <TouchableOpacity
                onPress={() => {
                  setShowEmojis(!showEmojis);
                  setShowActions(false);
                }}
              >
                <Ionicons
                  name={showEmojis ? "keyboard-outline" : "happy-outline"}
                  size={22}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!message.trim()}
              className={`p-3 rounded-full ${
                message.trim() ? "bg-primary" : "bg-slate-300"
              }`}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {showActions && (
            <View className="h-28 mt-3 bg-slate-50 flex-row justify-around items-center">
              <Ionicons name="image" size={28} color="#3b82f6" />

              <Ionicons name="camera" size={28} color="green" />

              <Ionicons name="document-text" size={28} color="orange" />
            </View>
          )}

          {showEmojis && (
            <View className="h-48 bg-slate-50 mt-3 p-3">
              <ScrollView>
                <View className="flex-row flex-wrap gap-4">
                  {["😀", "😂", "😍", "🥰", "👍", "🔥", "❤️", "💯"].map(
                    (emo, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleEmojiSelect(emo)}
                      >
                        <Text className="text-3xl">{emo}</Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
