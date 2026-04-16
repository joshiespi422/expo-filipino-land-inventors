import api from "@/services/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const handleChangePassword = async () => {
    if (form.new_password !== form.new_password_confirmation) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch("/profile/change-password", form);
      if (response.data.success) {
        Alert.alert("Success", "Password updated successfully!");
        router.back();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || "Could not update password";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-[#034194] mb-2">Security</Text>
      <Text className="text-gray-500 mb-8">
        Update your password to keep your account secure.
      </Text>

      <View className="space-y-4">
        <TextInput
          secureTextEntry
          placeholder="Current Password"
          value={form.current_password}
          onChangeText={(t) => setForm({ ...form, current_password: t })}
          className="border border-gray-200 p-4 rounded-xl bg-gray-50"
        />

        <TextInput
          secureTextEntry
          placeholder="New Password"
          value={form.new_password}
          onChangeText={(t) => setForm({ ...form, new_password: t })}
          className="border border-gray-200 p-4 rounded-xl bg-gray-50"
        />

        <TextInput
          secureTextEntry
          placeholder="Confirm New Password"
          value={form.new_password_confirmation}
          onChangeText={(t) =>
            setForm({ ...form, new_password_confirmation: t })
          }
          className="border border-gray-200 p-4 rounded-xl bg-gray-50"
        />
      </View>

      <TouchableOpacity
        onPress={handleChangePassword}
        disabled={loading}
        className="bg-[#034194] p-4 rounded-xl mt-8 flex-row justify-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
