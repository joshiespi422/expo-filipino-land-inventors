import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const { clearAuth, user } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out of your account?", [
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

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* --- USER PROFILE CARD --- */}
      <View className="bg-white p-8 items-center shadow-sm border-b border-gray-100">
        <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center border-4 border-primary/20">
          <Ionicons name="person" size={50} color="#034194" />
        </View>

        <Text className="text-2xl font-bold mt-4 text-[#034194]">
          {user?.name || "Joshua Payumo"}
        </Text>
        <Text className="text-gray-500 font-medium">
          {user?.role === "super_admin"
            ? "Super Admin"
            : "Full-Stack Developer"}
        </Text>
      </View>

      {/* --- MENU OPTIONS --- */}
      <View className="mt-6 px-4">
        <Text className="text-gray-400 font-bold mb-3 ml-2 uppercase text-[11px] tracking-wider">
          Account Settings
        </Text>

        <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <ProfileMenuItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => console.log("Edit Profile")}
          />

          <ProfileMenuItem
            icon="lock-closed-outline"
            title="Security & Password"
            onPress={() => console.log("Security")}
          />
        </View>

        <Text className="text-gray-400 font-bold mt-8 mb-3 ml-2 uppercase text-[11px] tracking-wider">
          System
        </Text>

        <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-10">
          {/* --- LOGOUT BUTTON --- */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-4 border-t border-gray-50 bg-red-50/20"
          >
            <View className="flex-row items-center">
              <View className="bg-red-100 p-2 rounded-lg">
                <MaterialIcons name="logout" size={22} color="#D70127" />
              </View>
              <Text className="text-[#D70127] font-bold text-base ml-3">
                Logout Account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D70127" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Reusable Menu Component
function ProfileMenuItem({
  icon,
  title,
  onPress,
}: {
  icon: any;
  title: string;
  onPress: () => void;
}) {
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
