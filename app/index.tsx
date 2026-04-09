import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import Businessicon from "../assets/images/icon/Businessicon.png";
import image from "../assets/images/image.png";

import "../global.css";

export default function LoginPage() {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1"
    >
      <View className="flex-1 bg-white items-center">
        <View className="px-6 pt-2 w-full max-w-[500px] border mx-auto">
          <View>
            {/* text */}
            <Text className="text-2xl text-slate-800 text-center">
              Hello, <Text className="font-bold">Juan Dela Cruz!</Text>
            </Text>
            <Text className="text-md text-slate-800 text-center">
              How can we help you today?
            </Text>

            {/* Image  */}
            <Image
              source={image}
              className="!w-full !h-32 mt-5"
              resizeMode="contain"
            />

            {/* Button Link */}
            <View className="pt-5 grid gap-4 grid-cols-3">
              <Link href="/" className="grid gap-0 text-center !w-20">
                <Image
                  source={Businessicon}
                  className="!w-12 !h-12 mx-auto"
                  resizeMode="contain"
                />
                <Text>Business Training</Text>
              </Link>

              <Link href="/" className="grid text-center !w-20">
                <Image
                  source={Businessicon}
                  className="!w-12 !h-12 mx-auto"
                  resizeMode="contain"
                />
                Intellectual Property Assistance
              </Link>

              <Link href="/" className="grid text-center !w-20">
                <Image
                  source={Businessicon}
                  className="!w-12 !h-12 mx-auto"
                  resizeMode="contain"
                />
                Funding & Invest Opportunities
              </Link>

              <Link href="/" className="grid text-center !w-20">
                <Image
                  source={Businessicon}
                  className="!w-12 !h-12 mx-auto"
                  resizeMode="contain"
                />
                Licensing & Permit Assistant
              </Link>

              <Link href="/" className="grid text-center !w-20">
                <Image
                  source={Businessicon}
                  className="!w-12 !h-12 mx-auto"
                  resizeMode="contain"
                />
                R & D Collaboration
              </Link>

              <Link href="/" className="grid text-center !w-20">
                <Image
                  source={Businessicon}
                  className="!w-12 !h-12 mx-auto"
                  resizeMode="contain"
                />
                Ask an Expert Assistance
              </Link>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
