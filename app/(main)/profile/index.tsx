import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react"; // Added useCallback
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { clearAuth, user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Added refreshing state
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const userTypeName = user?.user_type?.name?.toUpperCase() || "";
  const statusName = user?.status?.name?.toLowerCase() || "";

  const isBasic = userTypeName === "BASIC";
  const isActive = statusName === "active";
  const isPendingMember = statusName === "pending_for_member";

  // Unified fetch function
  const fetchProfile = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await profileService.getProfile();
      setUser(data);
    } catch (error: any) {
      console.error("Profile Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop refresh indicator
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // onRefresh Handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(true);
  }, []);

  const pickAndUploadImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      setUploading(true);
      setShowOptions(false);

      const response = await profileService.updateAvatar({
        uri: file.uri,
        name: file.name ?? "avatar.jpg",
        type: file.mimeType ?? "image/jpeg",
      });

      if (response.success) {
        setUser({ ...(user || {}), avatar: response.data.avatar });
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error: any) {
      Alert.alert("Upload Failed", "Network Error");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarPress = () => {
    if (!user?.avatar) pickAndUploadImage();
    else setShowOptions(true);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await clearAuth();
            router.replace("/login");
          } catch (error) {
            setLoggingOut(false);
            Alert.alert("Error", "Logout failed. Please try again.");
          }
        },
      },
    ]);
  };

  const getStatusColor = (statusName: string) => {
    const status = statusName?.toLowerCase() || "";
    if (status.includes("pending")) return "text-[#C6890F] bg-orange-50";
    if (status.includes("active") || status.includes("approved"))
      return "text-green-500 bg-green-50";
    return "text-gray-500 bg-gray-50";
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#034194"]}
          tintColor="#034194"
        />
      }
    >
      {/* --- PROFILE HEADER --- */}
      <View className="bg-white px-8 py-12 items-center shadow-sm border-b border-gray-100">
        <TouchableOpacity
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          className="relative"
        >
          <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center border-4 border-[#03419420] overflow-hidden">
            {uploading ? (
              <ActivityIndicator color="#034194" />
            ) : user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-full h-full" />
            ) : (
              <Ionicons name="person" size={50} color="#034194" />
            )}
          </View>
          <View className="absolute bottom-0 right-0 bg-[#034194] p-1.5 rounded-full border-2 border-white shadow-sm">
            <Ionicons name="camera" size={14} color="white" />
          </View>
        </TouchableOpacity>

        <Text className="text-2xl font-bold mt-4 text-[#034194]">
          {user?.name || "Member"}
        </Text>

        <View
          className={`mt-2 px-4 py-1 rounded-full ${getStatusColor(
            user?.status?.name,
          )}`}
        >
          <Text className="font-bold text-xs uppercase tracking-tighter">
            {user?.user_type?.name || "Basic"} • Account
          </Text>
        </View>
      </View>

      {/* --- WARNING SECTION: BASIC & ACTIVE --- */}
      {isBasic && isActive && (
        <View className="mt-6 px-4">
          <View className="bg-orange-50 border border-orange-200 p-5 rounded-[30px]">
            <View className="flex-row items-center">
              <View className="bg-[#C6890F] p-2 rounded-full">
                <Ionicons name="warning" size={20} color="white" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-[#C6890F] font-bold text-lg">
                  Complete Your Profile
                </Text>
              </View>
            </View>

            <Text className="text-[#C6890F] text-sm mt-2 leading-5">
              To upgrade to Member status and unlock all features, please
              provide your information, address, and a valid ID.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/profile/setupProfile")}
              className="bg-[#C6890F] mt-4 py-3 rounded-2xl items-center flex-row justify-center"
            >
              <Text className="text-white font-bold text-base mr-2">
                Complete Now
              </Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- PENDING NOTIFICATION --- */}
      {isBasic && isPendingMember && (
        <View className="mt-6 px-4">
          <View className="bg-blue-50 border border-blue-200 p-5 rounded-[30px] flex-row items-center">
            <View className="bg-[#034194] p-2 rounded-full">
              <Ionicons name="time" size={20} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[#034194] font-bold text-lg">
                Review in Progress
              </Text>
              <Text className="text-blue-800 text-sm leading-5">
                Your account details have been completed. Please wait 2-3 days
                for approval. Updates will be sent to your email.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* --- MENU ITEMS --- */}
      {(!isBasic || isPendingMember) && (
        <View className="mt-6 px-4">
          <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase text-[11px] tracking-wider">
            Account Settings
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <ProfileMenuItem
              icon="person-outline"
              title="Information"
              onPress={() => router.push("/profile/editProfile?info")}
            />
            <ProfileMenuItem
              icon="location-outline"
              title="Address"
              onPress={() => router.push("/profile/editProfile?location")}
            />
            <ProfileMenuItem
              icon="id-card-outline"
              title="Valid ID"
              onPress={() => router.push("/profile/editProfile?vakidID")}
            />
            <ProfileMenuItem
              icon="lock-closed-outline"
              title="Security & Password"
              onPress={() => router.push("/profile/changePassword")}
            />
          </View>

          <View>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loggingOut}
              className="mt-4 mb-10 flex-row items-center p-4 bg-[#D7012710] rounded-2xl border border-[#D7012730]"
            >
              {loggingOut ? (
                <ActivityIndicator color="#D70127" className="mx-auto" />
              ) : (
                <>
                  <MaterialIcons name="logout" size={22} color="#D70127" />
                  <Text className="text-[#D70127] font-bold ml-3 text-base">
                    Logout Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- LOGOUT FOR BASIC/ACTIVE --- */}
      {isBasic && isActive && (
        <View className="px-4">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loggingOut}
            className="mt-4 mb-10 flex-row items-center p-4 bg-[#D7012710] rounded-2xl border border-[#D7012730]"
          >
            {loggingOut ? (
              <ActivityIndicator color="#D70127" className="mx-auto" />
            ) : (
              <>
                <MaterialIcons name="logout" size={22} color="#D70127" />
                <Text className="text-[#D70127] font-bold ml-3 text-base">
                  Logout Account
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* --- MODALS --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showOptions}
        statusBarTranslucent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-5">
          <View className="bg-white p-8 rounded-[40px] items-center w-full max-w-[380px] shadow-2xl">
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="image" size={32} color="#034194" />
            </View>
            <Text className="text-xl font-bold text-[#333] mb-2 text-center">
              Profile Photo
            </Text>
            <View className="w-full gap-y-3 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setShowOptions(false);
                  setShowFullImage(true);
                }}
                className="w-full flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <Ionicons name="eye-outline" size={20} color="#034194" />
                <Text className="ml-3 font-bold text-gray-700">View Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickAndUploadImage}
                className="w-full flex-row items-center p-4 bg-blue-50 rounded-2xl border border-blue-100"
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#034194"
                />
                <Text className="ml-3 font-bold text-[#034194]">
                  Upload New
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowOptions(false)}
                className="w-full mt-2 p-4 items-center"
              >
                <Text className="text-gray-400 font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showFullImage} transparent={false} animationType="fade">
        <View className="flex-1 bg-black items-center justify-center">
          <TouchableOpacity
            onPress={() => setShowFullImage(false)}
            className="absolute top-12 right-6 p-2 bg-white/20 rounded-full z-10"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          {user?.avatar && (
            <Image
              source={{ uri: user.avatar }}
              className="w-full h-auto aspect-square"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

function ProfileMenuItem({ icon, title, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between p-4 border-b border-gray-50"
    >
      <View className="flex-row items-center">
        <View className="bg-blue-50 p-2 rounded-lg">
          <Ionicons name={icon} size={22} color="#034194" />
        </View>
        <Text className="text-[#333] font-semibold text-base ml-3">
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}
