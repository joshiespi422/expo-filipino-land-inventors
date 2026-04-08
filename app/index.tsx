import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import "../global.css";

export default function LoginPage() {
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const isProcessing = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    if (isProcessing.current || isLoading) return;

    if (!number || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    isProcessing.current = true;
    setIsLoading(true);

    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false);
      isProcessing.current = false;
      Alert.alert("Success", "Logged in!");
    }, 1500);
  };

  if (pageLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1"
    >
      <View className="flex-1 p-6 justify-center">
        <View className="space-y-4">
          <Text className="text-2xl font-bold text-slate-800 mb-6 text-center">
            Hello, Juan
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
