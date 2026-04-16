import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { clearAuth, user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setUser(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/login");
        },
      },
    ]);
  };

  const getStatusColor = (statusName: string) => {
    const status = statusName?.toLowerCase() || "";
    if (status.includes("pending")) return "text-orange-500 bg-orange-50";
    if (status.includes("active") || status.includes("approved"))
      return "text-green-500 bg-green-50";
    return "text-gray-500 bg-gray-50";
  };

  // --- LOGIC FOR MESSAGES ---
  const userTypeName = user?.user_type?.name?.toLowerCase() || "";
  const statusName = user?.status?.name?.toLowerCase() || "";

  const renderStatusMessage = () => {
    // 1. BASIC User + ACTIVE Status = Needs to complete profile
    if (userTypeName === "basic" && statusName === "active") {
      return (
        <View className="mx-4 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <View className="flex-row items-center mb-1">
            <Ionicons name="information-circle" size={20} color="#034194" />
            <Text className="ml-2 font-bold text-[#034194]">
              Complete Your Profile
            </Text>
          </View>
          <Text className="text-blue-700 text-sm mb-3">
            Please complete your account details to access all features.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/profile/editProfile")}
            className="bg-[#034194] py-2 rounded-lg items-center"
          >
            <Text className="text-white font-bold text-xs">
              Update Profile Now
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 2. BASIC User + PENDING Status = Waiting for approval
    if (userTypeName === "basic" && statusName.includes("pending")) {
      return (
        <View className="mx-4 mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
          <View className="flex-row items-center mb-1">
            <Ionicons name="time" size={20} color="#f97316" />
            <Text className="ml-2 font-bold text-orange-700">Under Review</Text>
          </View>
          <Text className="text-orange-600 text-xs">
            Your account details have been completed. Please wait 2-3 days for
            approval. Updates will be sent to your email.
          </Text>
        </View>
      );
    }

    // 3. MEMBER User + ACTIVE Status = No message (Fully verified)
    return null;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* --- USER PROFILE CARD --- */}
      <View className="bg-white p-8 items-center shadow-sm border-b border-gray-100">
        <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center border-4 border-primary/20 overflow-hidden">
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} className="w-full h-full" />
          ) : (
            <Ionicons name="person" size={50} color="#034194" />
          )}
        </View>

        <Text className="text-2xl font-bold mt-4 text-[#034194]">
          {user?.name || "Loading Name..."}
        </Text>

        <View
          className={`mt-2 px-4 py-1 rounded-full ${getStatusColor(user?.status?.name)}`}
        >
          <Text className="font-bold text-xs uppercase tracking-tighter">
            {user?.user_type?.name || "Member"} • Account
          </Text>
        </View>
      </View>

      {/* --- CONDITIONAL STATUS BANNER --- */}
      {renderStatusMessage()}

      {/* --- MENU OPTIONS --- */}
      <View className="mt-6 px-4">
        <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase text-[11px] tracking-wider">
          Account Settings
        </Text>

        <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <ProfileMenuItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push("/profile/editProfile")}
          />
          <ProfileMenuItem
            icon="lock-closed-outline"
            title="Security & Password"
            onPress={() => router.push("/profile/changePassword")}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className="mt-8 mb-10 flex-row items-center p-4 bg-red-50 rounded-2xl border border-red-100"
        >
          <MaterialIcons name="logout" size={22} color="#D70127" />
          <Text className="text-[#D70127] font-bold ml-3 text-base">
            Logout Account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ProfileMenuItem({ icon, title, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className="flex-row items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50"
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
