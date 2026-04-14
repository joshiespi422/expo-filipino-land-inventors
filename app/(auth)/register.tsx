import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  accountRegisterService,
  RegisterPayload,
} from "@/services/accountRegister";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function RegisterPage() {
  const router = useRouter();
  const phoneInputRef = useRef<TextInput>(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [number, setNumber] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // --- TANSTACK QUERY MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: RegisterPayload) => {
      return accountRegisterService.register(data);
    },
    onSuccess: () => {
      router.push({
        pathname: "/otpVerification",
        params: { phone: `09${number}` },
      });
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || "";

      // Check for the 429 status you set in Laravel
      if (status === 429) {
        // Option 1: Silent Redirect (Smoothest)
        router.push({
          pathname: "/otpVerification",
          params: { phone: `09${number}` },
        });
      } else {
        const errorMessage =
          message || "Registration failed. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    },
  });

  const handleRegister = () => {
    if (mutation.isPending || navigating) return;

    if (!fullName || !number) {
      return Alert.alert("Required", "Please fill in all fields");
    }

    if (number.length !== 9) {
      return Alert.alert(
        "Invalid Number",
        "Please enter the remaining 9 digits.",
      );
    }

    // Pass the '63' prefix to the API for Movider compatibility
    mutation.mutate({
      name: fullName,
      phone: `639${number}`,
    });
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
                /* --- SKELETON UI --- */
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
                      <Skeleton className="h-3 w-32 mb-2 ml-2 rounded-full" />
                      <Skeleton className="h-[58px] w-full rounded-2xl" />
                    </View>
                    <View>
                      <Skeleton className="h-3 w-40 mb-2 ml-2 rounded-full" />
                      <Skeleton className="h-[58px] w-full rounded-2xl" />
                    </View>
                  </View>
                  <Skeleton className="h-[64px] w-full rounded-2xl mt-4" />
                  <Skeleton className="h-4 w-40 self-center rounded-md" />
                </View>
              ) : (
                /* --- ACTUAL CONTENT --- */
                <>
                  <TitleAuth
                    title="Register Account"
                    containerClass="mb-8 mt-2"
                    description={
                      <View>
                        <Text className="text-center text-slate-900 text-sm">
                          Create an Account to get started
                        </Text>
                        <Text className="text-center text-slate-900 text-sm">
                          and access our services
                        </Text>
                      </View>
                    }
                  />

                  <View className="gap-y-5">
                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Enter Full Name
                      </Text>
                      <TextInput
                        className="bg-white p-4 rounded-2xl text-slate-800 border border-slate-200"
                        placeholder="Full Name"
                        placeholderTextColor="#94a3b8"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        editable={!mutation.isPending && !navigating}
                      />
                    </View>

                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Enter Mobile Number
                      </Text>
                      <Pressable
                        onPress={() =>
                          !mutation.isPending &&
                          !navigating &&
                          phoneInputRef.current?.focus()
                        }
                        className="flex-row items-center bg-white rounded-2xl border border-slate-200 overflow-hidden"
                      >
                        <View className="pl-4 pr-1 justify-center">
                          <Text className="text-slate-800 text-base font-medium">
                            09
                          </Text>
                        </View>
                        <TextInput
                          ref={phoneInputRef}
                          className="flex-1 p-4 pl-0 text-slate-800 text-base"
                          placeholder="XXXXXXX"
                          placeholderTextColor="#94a3b8"
                          value={number}
                          onChangeText={(text) =>
                            setNumber(text.replace(/[^0-9]/g, ""))
                          }
                          keyboardType="phone-pad"
                          maxLength={9}
                          editable={!mutation.isPending && !navigating}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={mutation.isPending || navigating}
                    activeOpacity={0.8}
                    className={`mt-7 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      mutation.isPending || navigating
                        ? "bg-slate-400"
                        : "bg-primary"
                    }`}
                  >
                    {mutation.isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {navigating ? "Redirecting..." : "Register Now"}
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
