// app/(intellectual)/chat-intellectual.tsx
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Send,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "@/services/api";
import {
  getConversation,
  Message,
  MessageAttachment,
  sendMessage,
} from "@/services/chatService";
import echo from "@/services/echo";

import "../../global.css";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ASSET_BASE_URL = "http://192.168.1.53:8000/storage/";

export default function ChatIntellectualPage() {
  const { conversationId, title } = useLocalSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [userId, setUserId] = useState<string | number | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  // Smooth Keyboard Animations & Icon Toggling
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const initChatSession = async () => {
      try {
        try {
          const userRes = await api.get("/profile");
          const resolvedId = userRes.data?.id || userRes.data?.user?.id || null;
          setUserId(resolvedId);
        } catch (userErr) {
          setUserId(null);
        }

        if (conversationId) {
          const conversationData = await getConversation(
            conversationId as string,
          );
          setMessages(conversationData.messages || []);
        }
      } catch (err) {
        console.error("Initialization of chat telemetry failed", err);
      } finally {
        setLoading(false);
      }
    };

    initChatSession();
  }, [conversationId]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !echo) return;

    const channelName = `conversation.${conversationId}`;
    try {
      channelRef.current = echo.private(channelName);
      channelRef.current.listen(".message.sent", (e: any) => {
        if (!e || !e.id) return;
        if (userId && String(e.sender_id) === String(userId)) return;

        const newMessage: Message = {
          id: e.id,
          conversation_id: Number(e.conversation_id),
          sender_id: e.sender_id,
          body: e.body,
          created_at: e.created_at || new Date().toISOString(),
          sender: e.sender,
          attachments: e.attachments || [],
        };

        setMessages((prev) => {
          const exists = prev.some(
            (m) => String(m.id) === String(newMessage.id),
          );
          if (exists) return prev;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          return [...prev, newMessage];
        });
      });
    } catch (err) {
      console.error("Failed to subscribe to channel:", err);
    }

    return () => {
      if (!echo) return;
      channelRef.current?.stopListening(".message.sent");
      echo.leave(channelName);
    };
  }, [conversationId, userId]);

  const processMessagePayload = async (
    payload: FormData | { body: string },
    tempId: string,
  ) => {
    if (!conversationId) return;
    setSending(true);

    try {
      const createdMessage = await sendMessage(
        conversationId as string,
        payload,
      );
      if (createdMessage) {
        setMessages((prev) =>
          prev.map((m) => (String(m.id) === tempId ? createdMessage : m)),
        );
      }
    } catch (err) {
      Alert.alert("Delivery Fail", "We couldn't deliver this message.");
      setMessages((prev) => prev.filter((m) => String(m.id) !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText("");

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId as any,
      conversation_id: Number(conversationId),
      sender_id: userId as number,
      body: textToSend,
      created_at: new Date().toISOString(),
      attachments: [],
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, tempMessage]);
    await processMessagePayload({ body: textToSend }, tempId);
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "We need access to add images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const targetAsset = result.assets[0];
      const formData = new FormData();

      let bodyText = "";
      if (inputText.trim()) {
        bodyText = inputText.trim();
        formData.append("body", bodyText);
        setInputText("");
      }

      const filename = targetAsset.uri.split("/").pop() || "upload.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mime = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("attachments[]", {
        uri:
          Platform.OS === "android"
            ? targetAsset.uri
            : targetAsset.uri.replace("file://", ""),
        name: filename,
        type: mime,
      } as any);

      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId as any,
        conversation_id: Number(conversationId),
        sender_id: userId as number,
        body: bodyText,
        created_at: new Date().toISOString(),
        attachments: [
          {
            id: tempId as any,
            path: targetAsset.uri,
            original_name: filename,
            mime_type: mime,
            size: targetAsset.fileSize || 0,
          },
        ],
      };

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMessages((prev) => [...prev, tempMessage]);
      await processMessagePayload(formData, tempId);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const targetFile = result.assets[0];
        const formData = new FormData();

        let bodyText = "";
        if (inputText.trim()) {
          bodyText = inputText.trim();
          formData.append("body", bodyText);
          setInputText("");
        }

        formData.append("attachments[]", {
          uri: targetFile.uri,
          name: targetFile.name,
          type: targetFile.mimeType || "application/octet-stream",
        } as any);

        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId as any,
          conversation_id: Number(conversationId),
          sender_id: userId as number,
          body: bodyText,
          created_at: new Date().toISOString(),
          attachments: [
            {
              id: tempId as any,
              path: targetFile.uri,
              original_name: targetFile.name,
              mime_type: targetFile.mimeType || "application/octet-stream",
              size: targetFile.size || 0,
            },
          ],
        };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages((prev) => [...prev, tempMessage]);
        await processMessagePayload(formData, tempId);
      }
    } catch (err) {
      console.error("Document selector failure", err);
    }
  };

  const handleAttachmentMenu = () => {
    Keyboard.dismiss();
    // Setting timeout allows keyboard to close smoothly before alert appears
    setTimeout(() => {
      Alert.alert(
        "Send Attachment",
        "Choose what kind of file you want to send.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Photo", onPress: handlePickImage },
          { text: "Document", onPress: handlePickDocument },
        ],
      );
    }, 100);
  };

  const renderAttachment = (attachment: MessageAttachment, isTemp: boolean) => {
    const isLocalUri =
      attachment.path.startsWith("file") ||
      attachment.path.startsWith("content");
    const fileUrl = isLocalUri
      ? attachment.path
      : attachment.path.startsWith("http")
        ? attachment.path
        : `${ASSET_BASE_URL}${attachment.path}`;

    const isImg = attachment.mime_type.startsWith("image/");

    if (isImg) {
      return (
        <View
          key={attachment.id}
          className="mb-2 rounded-xl overflow-hidden max-w-[240px]"
        >
          <Image
            source={{ uri: fileUrl }}
            className={`w-60 h-40 ${isTemp ? "opacity-60" : "opacity-100"}`}
            resizeMode="cover"
          />
          {isTemp && (
            <View className="absolute inset-0 justify-center items-center">
              <ActivityIndicator color="white" />
            </View>
          )}
        </View>
      );
    }

    return (
      <View
        key={attachment.id}
        className={`mb-2 p-2.5 rounded-xl bg-black/5 flex-row items-center gap-2 max-w-[240px] ${
          isTemp ? "opacity-60" : ""
        }`}
      >
        <FileText size={20} color="#64748B" />
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-xs font-medium text-slate-800"
          >
            {attachment.original_name}
          </Text>
          <Text className="text-[10px] text-slate-500">
            {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : ""}
          </Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe =
      userId !== null
        ? String(item.sender_id) === String(userId)
        : String(item.sender_id) === "14";
    const isTemp = String(item.id).startsWith("temp-");

    return (
      <View
        className={`flex-row mb-3 ${isMe ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl ${
            isMe
              ? "bg-[#0084FF] rounded-tr-sm"
              : "bg-[#F0F5FA] rounded-tl-sm border border-slate-100"
          }`}
        >
          {item.attachments &&
            item.attachments.map((file) => renderAttachment(file, isTemp))}

          {item.body ? (
            <Text
              className={`text-[15px] leading-5 ${isMe ? "text-white" : "text-slate-900"}`}
            >
              {item.body}
            </Text>
          ) : null}

          <View className="flex-row items-center justify-end gap-1 mt-1">
            <Text
              className={`text-[10px] text-right opacity-60 ${isMe ? "text-white" : "text-slate-500"}`}
            >
              {item.created_at
                ? new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
            {isTemp && (
              <ActivityIndicator
                size="small"
                color="white"
                style={{ transform: [{ scale: 0.5 }] }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header Bar */}
      <View className="flex-row items-center px-2 py-2 bg-white border-b border-slate-100 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full active:bg-slate-100 mr-1"
        >
          <ArrowLeft size={22} color="#1E293B" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-slate-900 font-bold text-base tracking-tight"
          >
            {title}
          </Text>
          <Text className="text-slate-400 text-[12px]">Offline</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) =>
            item.id ? String(item.id) : String(index)
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-slate-400 text-sm font-semibold">
                No conversation history found.
              </Text>
            </View>
          }
        />

        {/* Custom Styled Input Dock */}
        <View style={styles.inputContainer}>
          <View style={styles.leftActionContainer}>
            {isKeyboardVisible ? (
              <TouchableOpacity
                onPress={handleAttachmentMenu}
                style={styles.plusButton}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconRow}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={styles.iconButton}
                >
                  <ImageIcon size={24} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickDocument}
                  style={styles.iconButton}
                >
                  <Paperclip size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Type Your Message"
            placeholderTextColor="#94A3B8"
            multiline
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity
            onPress={handleSendText}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              inputText.trim()
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
          >
            <Send size={18} color={inputText.trim() ? "white" : "#94A3B8"} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// StyleSheet used to guarantee precise spacing outside of Tailwind constraints
const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end", // Aligns everything to the bottom perfectly
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  leftActionContainer: {
    justifyContent: "flex-end",
    paddingBottom: 4, // Aligns icons beautifully with the text box
    marginRight: 8,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 6,
    marginRight: 2,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0084FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2, // Fine-tuned vertical alignment
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: "#0F172A",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 2, // Fine-tuned vertical alignment
  },
  sendButtonActive: {
    backgroundColor: "#0084FF",
  },
  sendButtonInactive: {
    backgroundColor: "#F1F5F9",
  },
});
