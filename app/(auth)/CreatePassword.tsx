import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { passwordService } from "@/services/passwordService";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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
  const { phone, token } = useLocalSearchParams<{
    phone: string;
    token: string;
  }>();

  // Form States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI States
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Prevent going back since the verification process is mid-way
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Hold on!",
        "You need to set your password to complete registration.",
        [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Exit", onPress: () => router.replace("/login") },
        ],
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      passwordService.setPassword({
        phone: phone as string,
        password: password,
        password_confirmation: confirmPassword,
        verification_token: token as string,
      }),
    onSuccess: (data) => {
      // Backend returns 201 Created with the User and Sanctum token
      router.replace({
        pathname: "/congratulations",
        params: {
          token: data.token,
          user: JSON.stringify(data.user),
        },
      });
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 422) {
        // Handle Laravel Validation Errors (SetPasswordRequest)
        const validationErrors = data?.errors;
        const message = validationErrors
          ? Object.values(validationErrors).flat().join("\n")
          : "Invalid data provided.";
        Alert.alert("Validation Error", message);
      } else if (status === 403) {
        // Handle RuntimeException ('Invalid or expired verification token.')
        Alert.alert(
          "Session Expired",
          data?.message ||
            "Your verification token is invalid. Please verify your phone again.",
          [{ text: "OK", onPress: () => router.replace("/register") }],
        );
      } else if (status === 429) {
        // Handle 'throttle:5,1'
        Alert.alert(
          "Too Many Attempts",
          "Please wait a moment before trying to set your password again.",
        );
      } else {
        // Generic 500 error
        Alert.alert(
          "Error",
          data?.message || "Failed to complete registration. Please try again.",
        );
      }
    },
  });

  const handleRegister = () => {
    if (mutation.isPending) return;

    // Frontend Pre-validation
    if (!password || !confirmPassword) {
      return Alert.alert("Required", "Please fill in both password fields.");
    }
    if (password.length < 8) {
      return Alert.alert(
        "Security",
        "Password must be at least 8 characters long.",
      );
    }
    if (password !== confirmPassword) {
      return Alert.alert("Mismatch", "Passwords do not match.");
    }
    if (!agreeToTerms) {
      return Alert.alert(
        "Agreement",
        "Please agree to the Terms and Conditions to proceed.",
      );
    }

    mutation.mutate();
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
                  <Skeleton className="h-[64px] w-full rounded-2xl mt-4 mb-2" />
                </View>
              ) : (
                <>
                  <TitleAuth
                    title="Create Password"
                    containerClass="mb-5 mt-4"
                    description={
                      <View>
                        <Text className="text-center text-slate-900 text-sm">
                          Set a password for{" "}
                          <Text className="font-bold">+{phone}</Text> to finish
                          your registration.
                        </Text>
                      </View>
                    }
                  />

                  <View className="gap-y-5 mt-5">
                    {/* Password Field */}
                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Password
                      </Text>
                      <View className="relative">
                        <TextInput
                          className="bg-white p-4 pr-12 rounded-2xl text-slate-800 border border-slate-200"
                          placeholder="••••••••"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
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

                    {/* Confirm Password Field */}
                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Retype Password
                      </Text>
                      <View className="relative">
                        <TextInput
                          className="bg-white p-4 pr-12 rounded-2xl text-slate-800 border border-slate-200"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
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

                  {/* Terms Checkbox */}
                  <TouchableOpacity
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                    className="flex-row ps-2 pt-5 items-center"
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
                      <Text className="underline font-bold">
                        Terms and Conditions
                      </Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={mutation.isPending}
                    className={`mt-8 mb-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      mutation.isPending ? "bg-slate-400" : "bg-primary"
                    }`}
                  >
                    {mutation.isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        Complete Registration
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
