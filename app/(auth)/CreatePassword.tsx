import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function RegisterPage() {
  // State for inputs
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // State for UI logic
  //   const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  //   const handleRegister = () => {
  //     if (!password || !confirmPassword) {
  //       return Alert.alert("Error", "Please fill in all fields");
  //     }
  //     if (password !== confirmPassword) {
  //       return Alert.alert("Error", "Passwords do not match");
  //     }
  //     if (!agreeToTerms) {
  //       return Alert.alert("Error", "Please agree to the Terms and Conditions");
  //     }

  //     setIsLoading(true);
  //     // Simulate API Call
  //     setTimeout(() => {
  //       setIsLoading(false);
  //       console.log("Registration successful");
  //     }, 1500);
  //   };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 bg-slate-50">
        <HeaderAuth />

        {/* MAIN CONTENT */}
        <View className="flex-1 -mt-10">
          <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

          <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
            <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4">
              <LogoAuth />
              <TitleAuth />

              {/* Form Inputs */}
              <View className="gap-y-5">
                {/* Password Field */}
                <View>
                  <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                    Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="bg-white p-4 pr-12 rounded-2xl text-slate-800 border border-slate-200"
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Retype Password Field */}
                <View>
                  <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                    Retype Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="bg-white p-4 pr-12 rounded-2xl text-slate-800 border border-slate-200"
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={22}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Agreement */}
              <TouchableOpacity
                onPress={() => setAgreeToTerms(!agreeToTerms)}
                className="flex-row ps-2 pt-5 items-center"
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                    agreeToTerms
                      ? "bg-primary border-primary"
                      : "border-slate-300 bg-slate-50"
                  }`}
                >
                  {agreeToTerms && (
                    <View className="w-2 h-2 bg-white rounded-sm" />
                  )}
                </View>
                <Text className="text-primary text-sm font-medium">
                  I agree to the{" "}
                  <Text className="underline">Terms and Conditions</Text>
                </Text>
              </TouchableOpacity>

              <Link
                href={"/congratulations"}
                className={`mt-8 mb-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center bg-primary`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Create Account
                </Text>
              </Link>

              {/* Register Button */}
              {/* <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                className={`mt-8 mb-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                  isLoading ? "bg-slate-400" : "bg-primary"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity> */}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
