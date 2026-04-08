import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
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

  // EXTRA LOCK: This prevents "double-fire" clicks instantly
  const isProcessing = useRef(false);

  const [fullName, setFullName] = useState("");
  const [number, setNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Very snappy loading (0.4s)
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = () => {
    if (isProcessing.current || isLoading || navigating) return;

    if (!fullName || !number) {
      return Alert.alert("Required", "Please fill in all fields");
    }

    if (number.length !== 9) {
      return Alert.alert(
        "Invalid Number",
        "Please enter the remaining 9 digits.",
      );
    }

    // SET LOCKS IMMEDIATELY
    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/otpSend");
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
          {/* Blue Background Header */}
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
                        editable={!isLoading && !navigating}
                      />
                    </View>

                    <View>
                      <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                        Enter Mobile Number
                      </Text>
                      <Pressable
                        onPress={() =>
                          !isLoading &&
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
                          editable={!isLoading && !navigating}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={isLoading || navigating}
                    activeOpacity={0.8}
                    className={`mt-7 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      isLoading || navigating ? "bg-slate-400" : "bg-primary"
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {navigating ? "Redirecting..." : "Verify Now?"}
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
