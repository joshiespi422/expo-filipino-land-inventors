import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import { Link } from "expo-router";
import React, { memo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OTPVerification from "../../assets/images/vector/OTPVerificationCode.png";
import "../../global.css";

// OTP Box
const OtpInputBox = memo(function OtpInputBox({
  digit,
  isFocused,
}: {
  digit: string;
  isFocused: boolean;
}) {
  return (
    <View
      className={`w-11 h-14 border-2 rounded-xl justify-center items-center bg-slate-50 ${
        isFocused ? "border-primary" : "border-slate-200"
      }`}
    >
      <Text className="text-primary text-2xl font-bold">{digit}</Text>
    </View>
  );
});

export default function OtpPage() {
  const [otp, setOtp] = useState("");
  //   const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  //   const handleVerify = () => {
  //     if (otp.length < 6) return;
  //     setIsLoading(true);
  //     setTimeout(() => {
  //       setIsLoading(false);
  //       console.log("OTP Verified:", otp);
  //     }, 1500);
  //   };

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

              <View className="pt-3">
                <Image
                  source={OTPVerification}
                  className="!w-40 !h-48 self-center"
                  resizeMode="contain"
                />
              </View>

              <View className="mb-8 mt-4">
                <Text className="text-3xl font-bold text-primary text-center">
                  OTP Verification
                </Text>
                <Text className="text-center text-slate-800 mt-1 text-sm">
                  Enter the OTP sent to{" "}
                  <Text className="font-bold">+639123123123</Text>
                </Text>
              </View>

              {/* Hidden Input */}
              <View>
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
                  style={{ position: "absolute", opacity: 0, width: 1 }}
                />

                {/* OTP Boxes */}
                <Pressable
                  onPress={() => inputRef.current?.focus()}
                  className="flex-row justify-between items-center"
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

              <Link
                href={"/SuccessVerification"}
                className={`mt-5 py-5 rounded-2xl shadow-lg flex-row justify-center items-center bg-primary`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Get OTP?
                </Text>
              </Link>

              {/* Back to Login */}
              <View className="flex-row justify-center mt-5">
                <Link href={"/login"} asChild>
                  <TouchableOpacity>
                    <Text className="text-primary text-lg font-bold">
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

{
  /* Verify Button */
}
{
  /* <TouchableOpacity
                onPress={handleVerify}
                disabled={isLoading || otp.length < 6}
                className={`mt-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                  isLoading || otp.length < 6 ? "bg-slate-300" : "bg-primary"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Verify</Text>
                )}
              </TouchableOpacity> */
}
