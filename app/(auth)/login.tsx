import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function LoginPage() {
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!number || !password) return alert("Please fill in all fields");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log("Form submitted locally:", { number, password });
    }, 1500);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 bg-slate-50">
        {/* Header title */}
        <HeaderAuth />

        {/* MAIN CONTENT */}
        <View className="flex-1 -mt-10">
          <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

          <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
            <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md [shadow-offset:0px_3px] [shadow-opacity:0.24] [shadow-radius:8px] elevation-4">
              {/* Logo */}
              <LogoAuth />

              {/* title */}
              <TitleAuth />

              {/* Form Inputs */}
              <View className="gap-y-5">
                <View>
                  <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                    Mobile Number
                  </Text>
                  <TextInput
                    className="bg-white p-4 rounded-2xl text-slate-800 border border-slate-200"
                    placeholder="09123123123"
                    placeholderTextColor="#94a3b8"
                    value={number}
                    onChangeText={setNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>

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
              </View>

              {/* Remember Me & Forgot Password */}
              <View className="flex-row justify-between items-center mt-4 px-1">
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                      rememberMe
                        ? "bg-primary border-primary"
                        : "border-slate-300 bg-slate-50"
                    }`}
                  >
                    {rememberMe && (
                      <View className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </View>
                  <Text className="text-slate-500 text-sm font-medium">
                    Remember me
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                  <Text className="text-primary text-sm underline">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                className={`mt-8 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                  isLoading ? "bg-slate-400" : "bg-primary"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Log in</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View className="flex-row justify-center mt-5">
                <TouchableOpacity>
                  <Link
                    href={"/register"}
                    className="text-primary text-lg font-bold"
                  >
                    Create New Account?
                  </Link>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
