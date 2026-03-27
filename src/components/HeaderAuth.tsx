import { usePathname } from "expo-router";
import { Text, View } from "react-native";

export default function OtpPage() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <View className="bg-primary pt-14 pb-28 items-center justify-center">
      <Text className="font-bold text-4xl text-white tracking-tight">
        {isLoginPage ? "Hello" : "Join Us"}
      </Text>

      <Text className="text-lg text-white opacity-80 pb-4 font-medium">
        {isLoginPage ? "Welcome back!" : ""}
      </Text>
    </View>
  );
}
