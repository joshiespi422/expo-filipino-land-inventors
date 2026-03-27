import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center px-3">
      <View className="flex-row justify-evenly mb-5">
        <Text className="text-primary font-bold text-xl">Hello</Text>
      </View>

      {/* FIXED ROUTES */}
      <Link href="/login" className="text-blue-500 py-2">
        Auth Login
      </Link>

      <Link href="/register" className="text-blue-500 py-2">
        Auth Register
      </Link>
    </View>
  );
}
