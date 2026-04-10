import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function LoginPage() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const isProcessing = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (isProcessing.current || isLoading || navigating) return;

    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("../(main)/");
    }, 800);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 bg-slate-50">
        <HeaderAuth title="Hello" subtitle="Welcome back!" />

        <View className="flex-1 -mt-10">
          <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

          <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
            <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4 mb-10">
              {pageLoading ? (
                <View className="items-center mb-4">
                  <View className="mt-[-76px] bg-white rounded-full shadow-sm">
                    <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />
                  </View>
                </View>
              ) : (
                <LogoAuth />
              )}

              {pageLoading ? (
                <View className="gap-y-6">
                  <View className="items-center gap-y-3">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <View className="items-center gap-y-1.5 w-full">
                      <Skeleton className="h-3 w-[90%] rounded-md" />
                      <Skeleton className="h-3 w-[80%] rounded-md" />
                      <Skeleton className="h-3 w-[60%] rounded-md" />
                    </View>
                  </View>

                  <View className="gap-y-5 mt-2">
                    <View>
                      <Skeleton className="h-3 w-24 mb-2 ml-2 rounded-full" />
                      <Skeleton className="h-[58px] w-full rounded-2xl" />
                    </View>
                    <View>
                      <Skeleton className="h-3 w-20 mb-2 ml-2 rounded-full" />
                      <Skeleton className="h-[58px] w-full rounded-2xl" />
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center px-1">
                    <Skeleton className="h-5 w-28 rounded-md" />
                    <Skeleton className="h-5 w-28 rounded-md" />
                  </View>

                  <Skeleton className="h-[64px] w-full rounded-2xl mt-4" />
                  <Skeleton className="h-4 w-40 self-center rounded-md" />
                </View>
              ) : (
                <>
                  <TitleAuth
                    title="Login Account"
                    description={
                      <View>
                        <Text className="text-center text-slate-900 text-sm">
                          Log in to your account to securely access
                        </Text>
                        <Text className="text-center text-slate-900 text-sm">
                          your dashboard, manage your information,
                        </Text>
                        <Text className="text-center text-slate-900 text-sm">
                          and use all available features.
                        </Text>
                      </View>
                    }
                  />

                  <View className="gap-y-5">
                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Mobile Number
                      </Text>
                      <TextInput
                        className="bg-white p-4 rounded-2xl text-slate-800 border border-slate-200"
                        placeholder="Mobile Number"
                        value={number}
                        onChangeText={setNumber}
                        keyboardType="phone-pad"
                        editable={!isLoading && !navigating}
                      />
                    </View>

                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Password
                      </Text>
                      <View className="relative">
                        <TextInput
                          className="bg-white p-4 pr-12 rounded-2xl text-slate-800 border border-slate-200"
                          placeholder="Password"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          editable={!isLoading && !navigating}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                          disabled={isLoading || navigating}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={22}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mt-4 px-1">
                    <TouchableOpacity
                      onPress={() => setRememberMe(!rememberMe)}
                      className="flex-row items-center"
                      activeOpacity={0.7}
                      disabled={isLoading || navigating}
                    >
                      <View
                        className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                          rememberMe
                            ? "bg-primary border-primary"
                            : "border-slate-300 bg-slate-50"
                        }`}
                      >
                        {rememberMe && (
                          <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                        )}
                      </View>
                      <Text className="text-primary text-sm">Remember me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={isLoading || navigating}
                    >
                      <Text className="text-primary text-sm underline">
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading || navigating}
                    activeOpacity={0.8}
                    className={`mt-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      isLoading || navigating ? "bg-slate-400" : "bg-primary"
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg text-center">
                        {navigating ? "Redirecting..." : "Log in"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <LinkAuth
                    onNavigating={setNavigating}
                    isNavigating={navigating}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
