import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
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
  // Updated States
  const [fullName, setFullName] = useState("");
  const [number, setNumber] = useState("");
  // const [isLoading, setIsLoading] = useState(false);

  // const handleRegister = () => {
  //   // Validation check for Name and Number
  //   if (!fullName || !number) return alert("Please fill in all fields");

  //   setIsLoading(true);

  //   // Simulate API Call
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     console.log("Registration attempt:", { fullName, number });
  //   }, 1500);
  // };

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
                {/* Full Name Input */}
                <View>
                  <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                    Enter Full Name
                  </Text>
                  <TextInput
                    className="bg-white p-4 rounded-2xl text-slate-800 border border-slate-200"
                    placeholder="Juan Dela Cruz"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                    keyboardType="default"
                    autoCapitalize="words"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                {/* Mobile Number Input */}
                <View>
                  <Text className="text-primary mb-2 ml-2 font-medium text-xs uppercase">
                    Enter Mobile Number
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="bg-white p-4 rounded-2xl text-slate-800 border border-slate-200"
                      placeholder="09123456789"
                      placeholderTextColor="#94a3b8"
                      value={number}
                      onChangeText={setNumber}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              </View>

              <Link
                href={"/otpSend"}
                className={`mt-8 py-5 rounded-2xl shadow-lg flex-row justify-center items-center bg-primary`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Verify Now?
                </Text>
              </Link>

              {/* Footer */}
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
  /* Sign Up Button */
}
{
  /* <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className={`mt-8 py-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
              isLoading ? "bg-slate-400" : "bg-primary"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Verify Now?</Text>
            )}
          </TouchableOpacity> */
}
