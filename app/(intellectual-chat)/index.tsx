// app/(intellectual)/chat-intellectual.tsx
import { Feather, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as NavigationBar from "expo-navigation-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { COLORS, styles } from "@/components/chat-design";
import api from "@/services/api";
import { getConversation, Message, sendMessage } from "@/services/chatService";
import echo from "@/services/echo";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ChatIntellectualPageInner() {
  const { conversationId, title } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState<string | number | null>(null);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null,
  );
  const [imageRefresh, setImageRefresh] = useState(0); // Force image refresh

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setVisibilityAsync("hidden").catch(() => {});
    NavigationBar.setBehaviorAsync("inset-touch").catch(() => {});
  }, []);

  // Force image refresh when messages update to fix blank image issue
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setImageRefresh((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const requestFilePermissions = useCallback(async () => {
    if (Platform.OS !== "android") return true;

    try {
      // For Android 6.0+, request runtime permissions
      const permission = await Promise.resolve(true); // Placeholder - permissions should be in app.json
      return permission;
    } catch (error) {
      console.warn("Permission request failed:", error);
      return false;
    }
  }, []);

  const normalizePath = useCallback((attachment: any): string => {
    const rawPath =
      attachment.path ||
      attachment.file_path ||
      attachment.url ||
      attachment.uri ||
      "";

    if (!rawPath) {
      console.warn("No path found in attachment:", attachment);
      return "";
    }

    if (
      rawPath.startsWith("http") ||
      rawPath.startsWith("file://") ||
      rawPath.startsWith("content://")
    )
      return rawPath;

    const apiBaseUrl = api.defaults.baseURL || "";
    const domainUrl = apiBaseUrl.replace(/\/api\/?$/, "");
    const finalUrl = `${domainUrl}/storage/${rawPath.replace(/^\/+/, "")}`;
    console.log("Normalized path:", { rawPath, finalUrl });
    return finalUrl;
  }, []);

  const handleOpenImage = (selectedUri: string) => {
    setViewerUri(selectedUri);
    setViewerVisible(true);
  };

  const handleCloseViewer = () => {
    setViewerVisible(false);
    setViewerUri(null);
  };

  // ==========================================
  // DOWNLOAD FILE - FOR ATTACHMENTS ONLY
  // (Similar to QR code download pattern)
  // ==========================================
  const handleDownloadFile = async (attachment: any) => {
    const finalUrl = normalizePath(attachment);
    const fileName =
      attachment.original_name || attachment.name || "downloaded-file";

    if (!finalUrl.startsWith("http")) {
      Alert.alert("Error", "Cannot download a local file.");
      return;
    }

    try {
      setDownloadingFileId(attachment.id);
      console.log("🔄 Starting download for:", fileName);

      // Request permissions
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "File storage permission is required to download files.",
        );
        setDownloadingFileId(null);
        return;
      }

      // Try multiple directory options with fallbacks
      let baseDir: string | null = null;

      console.log("FileSystem directories:", {
        cacheDirectory: FileSystem.cacheDirectory,
        documentDirectory: FileSystem.documentDirectory,
        temporaryDirectory: FileSystem.temporaryDirectory,
      });

      if (FileSystem.cacheDirectory && FileSystem.cacheDirectory.length > 0) {
        baseDir = FileSystem.cacheDirectory;
      } else if (
        FileSystem.documentDirectory &&
        FileSystem.documentDirectory.length > 0
      ) {
        baseDir = FileSystem.documentDirectory;
      } else if (
        FileSystem.temporaryDirectory &&
        FileSystem.temporaryDirectory.length > 0
      ) {
        baseDir = FileSystem.temporaryDirectory;
      }

      if (!baseDir || baseDir.length === 0) {
        console.error("All FileSystem directories are unavailable");
        throw new Error(
          "No writable directory available. Try saving to gallery instead.",
        );
      }

      // Ensure directory path ends with /
      if (!baseDir.endsWith("/")) {
        baseDir = baseDir + "/";
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const safeFileName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .substring(0, 50);
      const localUri = `${baseDir}download_${timestamp}_${randomSuffix}_${safeFileName}`;

      console.log("Download starting:", {
        url: finalUrl,
        savePath: localUri,
        usedDir: baseDir,
      });

      const { uri } = await FileSystem.downloadAsync(finalUrl, localUri);

      console.log("✓ Download completed:", uri);

      // Share file or show success
      if (await Sharing.isAvailableAsync()) {
        console.log("📤 Sharing file...");
        await Sharing.shareAsync(uri, {
          mimeType: attachment.mime_type || "application/octet-stream",
          dialogTitle: `Share ${fileName}`,
        });
      } else {
        Alert.alert("Success", `${fileName} downloaded successfully`);
      }

      setDownloadingFileId(null);
    } catch (error) {
      console.error("❌ Primary download failed:", error);

      // FALLBACK: Try to download directly to gallery using MediaLibrary
      try {
        console.log("🔄 Attempting fallback: Save to Media Library...");

        const mediaPermission = await MediaLibrary.requestPermissionsAsync();

        if (mediaPermission.status !== "granted") {
          throw new Error("Media Library permission denied");
        }

        // Try downloading to a temporary cache location first
        const tempUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}temp_${Date.now()}_${fileName}`;

        console.log("📥 Downloading to temp:", tempUri);

        const downloadResult = await FileSystem.downloadAsync(
          finalUrl,
          tempUri,
        );

        if (downloadResult.status === 200) {
          console.log("✓ Download succeeded, saving to gallery...");

          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          await MediaLibrary.createAlbumAsync("Downloads", asset, false);

          Alert.alert("Success", `${fileName} saved to your gallery`);
          setDownloadingFileId(null);
          return;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }

      setDownloadingFileId(null);
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert("Download Error", "Could not download file. " + errorMsg);
    }
  };

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

  useEffect(() => {
    if (!conversationId || !echo) return;

    const channelName = `conversation.${conversationId}`;
    try {
      channelRef.current = echo.private(channelName);
      channelRef.current.listen(".message.sent", (e: any) => {
        if (!e || !e.id) return;
        if (userId && String(e.sender_id) === String(userId)) return;

        const incomingAttachments = Array.isArray(e.attachments)
          ? e.attachments.map((att: any) => ({
              ...att,
              id: att.id || `att-${Date.now()}-${Math.random()}`,
            }))
          : [];

        const newMessage: Message = {
          id: e.id,
          conversation_id: Number(e.conversation_id),
          sender_id: e.sender_id,
          body: e.body,
          created_at: e.created_at || new Date().toISOString(),
          sender: e.sender,
          attachments: incomingAttachments,
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages((prev) =>
          prev.map((m) => (String(m.id) === tempId ? createdMessage : m)),
        );
      }
    } catch (err) {
      console.error("Upload error details:", err);
      Alert.alert("Delivery Fail", "We couldn't deliver this message.");
      setMessages((prev) => prev.filter((m) => String(m.id) !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const textToSend = draft.trim();
    setDraft("");

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
    if (sending) return;
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

      const bodyText = draft.trim();
      if (bodyText) {
        formData.append("body", bodyText);
      }
      setDraft("");

      const rawUri = targetAsset.uri;
      const filename =
        targetAsset.fileName || rawUri.split("/").pop() || "upload.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const mime = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("attachments[]", {
        uri: rawUri,
        name: filename,
        type: mime,
      } as any);

      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId as any,
        conversation_id: Number(conversationId),
        sender_id: userId as number,
        body: bodyText || null,
        created_at: new Date().toISOString(),
        attachments: [
          {
            id: tempId as any,
            path: rawUri,
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
    if (sending) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const targetFile = result.assets[0];
        const formData = new FormData();

        const bodyText = draft.trim();
        if (bodyText) {
          formData.append("body", bodyText);
        }
        setDraft("");

        const rawUri = targetFile.uri;
        const filename =
          targetFile.name || rawUri.split("/").pop() || "document";
        const mime = targetFile.mimeType || "application/octet-stream";

        formData.append("attachments[]", {
          uri: rawUri,
          name: filename,
          type: mime,
        } as any);

        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId as any,
          conversation_id: Number(conversationId),
          sender_id: userId as number,
          body: bodyText || null,
          created_at: new Date().toISOString(),
          attachments: [
            {
              id: tempId as any,
              path: rawUri,
              original_name: filename,
              mime_type: mime,
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
    setTimeout(() => {
      Alert.alert(
        "Send Attachment",
        "Choose what kind of file you want to send.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Photo Gallery", onPress: handlePickImage },
          { text: "Document File", onPress: handlePickDocument },
        ],
      );
    }, 100);
  };

  const renderAttachment = useCallback(
    (attachment: any, isTemp: boolean, isMe: boolean) => {
      const finalPathValue = normalizePath(attachment);
      const mimeType = attachment.mime_type || attachment.type || "";
      const isImage =
        mimeType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif)$/i.test(finalPathValue);

      const displayName =
        attachment.original_name ||
        attachment.name ||
        attachment.file_name ||
        attachment.filename ||
        (typeof finalPathValue === "string"
          ? finalPathValue.split("/").pop()
          : "") ||
        "Attachment File";

      // ==========================================
      // IMAGE RENDERING - VIEW ONLY (NO DOWNLOAD)
      // ==========================================
      if (isImage) {
        return (
          <TouchableOpacity
            key={`${attachment.id}-${imageRefresh}` || Math.random().toString()}
            activeOpacity={0.9}
            onPress={() => handleOpenImage(finalPathValue)}
            style={[styles.mediaBubbleBox, isTemp && { opacity: 0.7 }]}
          >
            <Image
              key={`img-${finalPathValue}-${imageRefresh}`}
              source={{ uri: `${finalPathValue}?t=${imageRefresh}` }}
              style={styles.media}
              resizeMode="cover"
              onLoad={() => {
                console.log("✓ Image loaded successfully:", finalPathValue);
              }}
              onError={(error) => {
                console.error("✗ Image load error:", {
                  path: finalPathValue,
                  error: error.nativeEvent,
                });
              }}
            />
            <Text
              style={[
                styles.imagePathText,
                { color: isMe ? "rgba(255,255,255,0.85)" : COLORS.inkDim },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              🖼️ {displayName}
            </Text>
          </TouchableOpacity>
        );
      }

      // ==========================================
      // ATTACHMENT RENDERING - DOWNLOADABLE ONLY
      // ==========================================
      const isDownloadingThis = downloadingFileId === attachment.id;

      return (
        <TouchableOpacity
          key={attachment.id || Math.random().toString()}
          activeOpacity={0.7}
          onPress={() => handleDownloadFile(attachment)}
          style={[
            styles.docContainer,
            isMe ? styles.docMe : styles.docThem,
            isTemp && { opacity: 0.6 },
          ]}
        >
          {isDownloadingThis ? (
            <ActivityIndicator
              size="small"
              color={isMe ? COLORS.bubbleOutText : COLORS.brand}
              style={{ marginRight: 8 }}
            />
          ) : (
            <Feather
              name="download-cloud"
              size={18}
              color={isMe ? COLORS.bubbleOutText : COLORS.brand}
              style={{ marginRight: 8 }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.docName,
                { color: isMe ? COLORS.bubbleOutText : COLORS.ink },
              ]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {displayName}
            </Text>
            {attachment.size ? (
              <Text
                style={{
                  color: isMe ? "rgba(255,255,255,0.7)" : COLORS.inkDim,
                  fontSize: 9,
                  marginTop: 1,
                }}
              >
                {(attachment.size / 1024).toFixed(1)} KB
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [normalizePath, downloadingFileId, imageRefresh],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isTemp = String(item.id).startsWith("temp-");

      const isMe = isTemp
        ? true
        : userId !== null
          ? String(item.sender_id) === String(userId)
          : String(item.sender_id) === "14";

      let showDateHeader = false;
      let dateString = "";

      if (item.created_at) {
        const currentDate = new Date(item.created_at);
        dateString = currentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          weekday: "long",
        });

        if (index === 0) {
          showDateHeader = true;
        } else {
          const prevItem = messages[index - 1];
          if (prevItem && prevItem.created_at) {
            const prevDate = new Date(prevItem.created_at);
            if (currentDate.toDateString() !== prevDate.toDateString()) {
              showDateHeader = true;
            }
          }
        }
      }

      return (
        <View>
          {showDateHeader && (
            <View style={styles.dateHeaderContainer}>
              <View style={styles.dateDivider} />
              <Text style={styles.dateHeaderText}>{dateString}</Text>
              <View style={styles.dateDivider} />
            </View>
          )}

          <View style={[styles.row, isMe ? styles.rowOut : styles.rowIn]}>
            {!isMe && (
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>
                  {item.sender?.name
                    ? item.sender.name.substring(0, 2).toUpperCase()
                    : "AG"}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.railDot,
                { backgroundColor: isMe ? COLORS.brand : COLORS.inkFaint },
              ]}
            />

            <View
              style={[styles.bubbleWrap, isMe && { alignItems: "flex-end" }]}
            >
              {!isMe && item.sender?.name && (
                <Text style={styles.senderLabel}>{item.sender.name}</Text>
              )}

              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleOut : styles.bubbleIn,
                ]}
              >
                {item.attachments && item.attachments.length > 0
                  ? item.attachments.map((file) =>
                      renderAttachment(file, isTemp, isMe),
                    )
                  : null}

                {item.body ? (
                  <Text
                    style={isMe ? styles.bubbleOutText : styles.bubbleInText}
                  >
                    {item.body}
                  </Text>
                ) : null}
              </View>

              <View
                style={[
                  styles.metaLine,
                  isMe && { flexDirection: "row-reverse" },
                ]}
              >
                {isMe && (
                  <Feather
                    name={isTemp ? "clock" : "check"}
                    size={12}
                    color={isTemp ? COLORS.inkFaint : COLORS.brand}
                    style={{ marginRight: 4, marginLeft: isTemp ? 4 : 4 }}
                  />
                )}
                <Text style={styles.metaText}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [userId, messages, renderAttachment],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar hidden={true} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <Feather
              name="chevron-left"
              size={22}
              color={COLORS.inkDim}
              style={{ marginRight: 4 }}
            />
          </TouchableOpacity>

          <View style={styles.avatarMain}>
            <Text style={styles.avatarMainText}>
              {typeof title === "string"
                ? title.substring(0, 2).toUpperCase()
                : "CH"}
            </Text>
            <View style={styles.avatarDot} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text numberOfLines={1} style={styles.headName}>
              {title || "Support Thread"}
            </Text>
            <View style={styles.headStatusRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.headStatus}>online — active channel</Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.threadContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View
          style={{
            paddingBottom: Math.min(insets.bottom, 10),
            backgroundColor: "#FFFFFF",
          }}
        >
          <View style={styles.composer}>
            <TouchableOpacity
              onPress={handleAttachmentMenu}
              style={{ paddingHorizontal: 4 }}
            >
              <Feather name="plus" size={20} color={COLORS.inkDim} />
            </TouchableOpacity>

            <View style={styles.compField}>
              <TextInput
                placeholder={`Message ${title || "Agent"}...`}
                placeholderTextColor={COLORS.inkFaint}
                style={styles.compInput}
                value={draft}
                onChangeText={setDraft}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!draft.trim() || sending) && { backgroundColor: COLORS.rail },
              ]}
              onPress={handleSend}
              disabled={!draft.trim() || sending}
              activeOpacity={0.8}
            >
              <Ionicons
                name="send"
                size={16}
                color={!draft.trim() || sending ? COLORS.inkFaint : "#ffffff"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ==========================================
          IMAGE VIEWER MODAL - VIEW ONLY
          ========================================== */}
      <Modal
        visible={viewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseViewer}
      >
        <View
          style={[
            styles.viewerContainer,
            { backgroundColor: "#000000", opacity: 1 },
          ]}
        >
          <View style={[styles.viewerHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={handleCloseViewer}
              style={styles.viewerCloseBtn}
            >
              <Feather name="x" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.viewerMain}>
            {viewerUri ? (
              <Image
                key={viewerUri}
                source={{ uri: viewerUri }}
                style={styles.viewerFullImage}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator size="large" color="#ffffff" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ChatIntellectualPage() {
  return (
    <SafeAreaProvider>
      <ChatIntellectualPageInner />
    </SafeAreaProvider>
  );
}
