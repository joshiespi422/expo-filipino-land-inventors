import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OTPVerification from "../../assets/images/vector/OTPVerification.png";
import "../../global.css";

export default function OtpPage() {
  const [number] = useState("09123123123");
  //   const [isLoading, setIsLoading] = useState(false);

  //   const handleOtpSend = () => {
  //     // Fixed logic: check 'number' state
  //     if (!number) return alert("Phone number is missing");

  //     setIsLoading(true);
  //     setTimeout(() => {
  //       setIsLoading(false);
  //       console.log("OTP Sent to:", number);
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

              {/* title */}
              <TitleAuth />

              <View className="gap-y-5">
                <View>
                  <TextInput
                    className="bg-slate-50 text-center p-4 rounded-2xl text-primary font-bold text-xl border border-slate-200"
                    value={number}
                    editable={false}
                    selectTextOnFocus={false}
                    keyboardType="phone-pad"
                    pointerEvents="none"
                  />
                </View>
              </View>

              <Link
                href={"/otpVerification"}
                className={`mt-5 py-5 rounded-2xl shadow-lg flex-row justify-center items-center bg-primary`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Get OTP?
                </Text>
              </Link>

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
  /* <TouchableOpacity
              onPress={handleOtpSend}
              disabled={isLoading}
              className={`mt-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                isLoading ? "bg-slate-400" : "bg-primary"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Get OTP?</Text>
              )}
            </TouchableOpacity> */
}
