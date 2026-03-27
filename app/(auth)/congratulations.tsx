import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Link } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import CongratulationsImg from "../../assets/images/vector/Congratulations.png";

export default function OtpPage() {
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
                  source={CongratulationsImg}
                  className="!h-52 self-center"
                  resizeMode="contain"
                />
              </View>

              {/* title */}
              <TitleAuth />

              <Link
                href={"/login"}
                className={`my-5 py-5 rounded-2xl shadow-lg flex-row justify-center items-center bg-primary`}
              >
                <Text className="text-white font-bold text-lg text-center">
                  Continue to Login
                </Text>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
