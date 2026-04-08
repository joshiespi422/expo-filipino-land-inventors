import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OTPVerification from "../../assets/images/vector/OTPVerificationCode.png";
import "../../global.css";

// Memoized OTP Box for performance
const OtpInputBox = memo(function OtpInputBox({
  digit,
  isFocused,
}: {
  digit: string;
  isFocused: boolean;
}) {
  return (
    <View
      className={`w-[14%] h-14 border-2 rounded-xl justify-center items-center bg-slate-50 ${
        isFocused ? "border-primary" : "border-slate-200"
      }`}
    >
      <Text className="text-primary text-2xl font-bold">{digit}</Text>
    </View>
  );
});

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const isProcessing = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  // Consistent snappy loading (0.4s)
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = () => {
    if (isProcessing.current || otp.length < 6 || isLoading || navigating)
      return;

    isProcessing.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/successVerification");
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
                /* --- OTP VERIFICATION SKELETON --- */
                <View className="gap-y-6">
                  <Skeleton className="w-40 h-48 self-center rounded-3xl mt-3" />
                  <View className="items-center gap-y-3">
                    <Skeleton className="h-8 w-56 rounded-lg" />
                    <Skeleton className="h-4 w-[75%] rounded-md" />
                  </View>
                  <View className="flex-row justify-between px-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="w-[14%] h-14 rounded-xl" />
                    ))}
                  </View>
                  <Skeleton className="h-[64px] w-full rounded-2xl mt-2" />
                  <View className="gap-y-4">
                    <Skeleton className="h-4 w-48 self-center rounded-md" />
                    <Skeleton className="h-4 w-40 self-center rounded-md" />
                  </View>
                </View>
              ) : (
                /* --- ACTUAL CONTENT --- */
                <>
                  <View className="pt-3">
                    <Image
                      source={OTPVerification}
                      className="w-40 h-48 self-center"
                      resizeMode="contain"
                    />
                  </View>

                  <TitleAuth
                    title="OTP Verification"
                    containerClass="mb-5 mt-4"
                    description={
                      <Text className="text-center text-slate-500 text-sm">
                        Enter the OTP sent to{" "}
                        <Text className="font-bold text-slate-800">
                          +63 912 312 3123
                        </Text>
                      </Text>
                    }
                  />

                  {/* OTP Input Section */}
                  <View className="relative">
                    <TextInput
                      ref={inputRef}
                      value={otp}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, "");
                        setOtp(cleaned);
                      }}
                      maxLength={6}
                      keyboardType="number-pad"
                      autoFocus={true}
                      textContentType="oneTimeCode"
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        zIndex: 1,
                      }}
                    />

                    <Pressable
                      onPress={() => inputRef.current?.focus()}
                      className="flex-row justify-between items-center px-2"
                      style={{ zIndex: 0 }}
                    >
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <OtpInputBox
                          key={index}
                          digit={otp[index] || ""}
                          isFocused={otp.length === index}
                        />
                      ))}
                    </Pressable>
                  </View>

                  <TouchableOpacity
                    onPress={handleVerify}
                    disabled={isLoading || otp.length < 6 || navigating}
                    activeOpacity={0.8}
                    className={`mt-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                      isLoading || otp.length < 6 || navigating
                        ? "bg-slate-300"
                        : "bg-primary"
                    }`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {navigating ? "Redirecting..." : "Verify OTP"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity className="mt-4" activeOpacity={0.7}>
                    <Text className="text-center text-slate-500 font-medium">
                      Did{"'"}t receive code?{" "}
                      <Text className="text-primary font-bold underline">
                        Resend
                      </Text>
                    </Text>
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
