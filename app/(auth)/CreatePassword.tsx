import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function CreatePasswordPage() {
  const router = useRouter();
  const isProcessing = useRef(false);

  // State for inputs
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // State for UI logic
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [navigating] = useState(false);

  // Consistent snappy loading (0.4s)
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = () => {
    if (isProcessing.current || isLoading || navigating) return;

    if (!password || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }
    if (!agreeToTerms) {
      return Alert.alert("Error", "Please agree to the Terms and Conditions");
    }

    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.replace("/congratulations");
    }, 800);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
    >
      <View className="flex-1 bg-slate-50">
        <HeaderAuth title="Join Us" />

        <View className="flex-1 -mt-10">
          <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

          <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
            <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4">
              {/* --- LOGO SECTION --- */}
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
                /* --- CREATE PASSWORD SKELETON --- */
                <View className="gap-y-6">
                  <View className="items-center gap-y-3">
                    <Skeleton className="h-8 w-56 rounded-lg" />
                    <View className="items-center gap-y-1.5 w-full">
                      <Skeleton className="h-3 w-[70%] rounded-md" />
                      <Skeleton className="h-3 w-[50%] rounded-md" />
                    </View>
                  </View>

                  <View className="gap-y-5 mt-2">
                    <View>
                      <Skeleton className="h-3 w-24 mb-2 ml-2 rounded-full" />
                      <Skeleton className="h-[58px] w-full rounded-2xl" />
                    </View>
                    <View>
                      <Skeleton className="h-3 w-32 mb-2 ml-2 rounded-full" />
                      <Skeleton className="h-[58px] w-full rounded-2xl" />
                    </View>
                  </View>

                  <View className="flex-row ps-2 pt-5 items-center px-1">
                    <Skeleton className="h-4 w-48 rounded-md" />
                  </View>

                  <Skeleton className="h-[64px] w-full rounded-2xl mt-4 mb-2" />
                </View>
              ) : (
                /* --- ACTUAL CONTENT --- */
                <>
                  <TitleAuth
                    title="Create Password"
                    containerClass="mb-5 mt-4"
                    description={
                      <View>
                        <Text className="text-center text-slate-900 text-sm">
                          Create a secure password to
                        </Text>
                        <Text className="text-center text-slate-900 text-sm">
                          protect your account.
                        </Text>
                      </View>
                    }
                  />

                  <View className="gap-y-5 mt-5">
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

                  <TouchableOpacity
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                    className="flex-row ps-2 pt-5 items-center"
                    activeOpacity={0.7}
                    disabled={isLoading || navigating}
                  >
                    <View
                      className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                        agreeToTerms
                          ? "bg-primary border-primary"
                          : "border-slate-300 bg-slate-50"
                      }`}
                    >
                      {agreeToTerms && (
                        <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                      )}
                    </View>
                    <Text className="text-primary text-sm">
                      I agree to the{" "}
                      <Text className="underline">Terms and Conditions</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
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
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text className="text-primary text-sm">
                      I agree to the{" "}
                      <Text className="underline">Terms and Conditions</Text>
                    </Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={isLoading || navigating}
                    activeOpacity={0.8}
                    className={`mt-8 mb-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      isLoading || navigating ? "bg-slate-400" : "bg-primary"
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {navigating ? "Redirecting..." : "Create Account"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
