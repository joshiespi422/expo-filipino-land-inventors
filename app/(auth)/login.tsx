import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Components
import { AuthInput } from "@/components/AuthInput";
import { CustomAlert } from "@/components/CustomAlert"; // Added this
import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import { LoginSkeleton } from "@/components/LoginSkeleton";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import "../../global.css";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({ number: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [loadingState, setLoadingState] = useState({
    page: true,
    action: false,
    nav: false,
  });

  const isProcessing = useRef(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setLoadingState((prev) => ({ ...prev, page: false })),
      400,
    );
    return () => clearTimeout(timer);
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlert({ visible: true, title, message });
  };

  const handleLogin = async () => {
    if (isProcessing.current || loadingState.action || loadingState.nav) return;

    if (!form.number.trim() || !form.password.trim()) {
      return showAlert(
        "Input Error",
        "Please fill in all required fields to continue.",
      );
    }

    isProcessing.current = true;
    setLoadingState((prev) => ({ ...prev, action: true }));

    try {
      // Note: If your API expects the full 11 digits,
      // you might need: `const fullNumber = "09" + form.number;`
      const data = await authService.login(form.number, form.password);
      await setAuth(data.token, data.user);

      setLoadingState((prev) => ({ ...prev, nav: true }));
      router.replace("/(main)");
    } catch (error: any) {
      let msg = "An unexpected error occurred. Please try again.";

      if (error?.errors) {
        const errorValues = Object.values(error.errors);
        msg = Array.isArray(errorValues[0])
          ? errorValues[0][0]
          : String(errorValues[0]);
      } else if (error?.message) {
        msg = error.message;
      }

      showAlert("Login Failed", msg);

      isProcessing.current = false;
      setLoadingState((prev) => ({ ...prev, action: false }));
    }
  };

  const isDisabled = loadingState.action || loadingState.nav;

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 bg-slate-50">
          <HeaderAuth title="Hello" subtitle="Welcome back!" />

          <View className="flex-1 -mt-10">
            <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

            <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
              <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4 mb-10">
                {loadingState.page ? (
                  <LoginSkeleton />
                ) : (
                  <>
                    <LogoAuth />
                    <TitleAuth
                      title="Login Account"
                      description="Log in to your account to securely access your dashboard and manage your features."
                    />

                    <AuthInput
                      label="Mobile Number"
                      placeholder="09123456789"
                      value={form.number}
                      onChangeText={(val) => setForm({ ...form, number: val })}
                      keyboardType="phone-pad"
                      editable={!isDisabled}
                    />

                    <AuthInput
                      label="Password"
                      placeholder="••••••••"
                      value={form.password}
                      onChangeText={(val) =>
                        setForm({ ...form, password: val })
                      }
                      editable={!isDisabled}
                      isPassword={true}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />

                    <View className="flex-row justify-between items-center px-1">
                      <TouchableOpacity
                        onPress={() => setRememberMe(!rememberMe)}
                        className="flex-row items-center"
                        disabled={isDisabled}
                        activeOpacity={0.7}
                      >
                        <View
                          className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                            rememberMe
                              ? "bg-primary border-primary"
                              : "border-slate-300 bg-slate-50"
                          }`}
                        >
                          {rememberMe && (
                            <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                          )}
                        </View>
                        <Text className="text-primary text-sm">
                          Remember me
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity disabled={isDisabled}>
                        <Text className="text-primary text-sm underline">
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                      className={`mt-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                        isDisabled ? "bg-slate-400" : "bg-primary"
                      }`}
                    >
                      {loadingState.action ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-bold text-lg">
                          {loadingState.nav ? "Redirecting..." : "Log in"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <LinkAuth
                      onNavigating={(val) =>
                        setLoadingState((p) => ({ ...p, nav: val }))
                      }
                      isNavigating={loadingState.nav}
                    />
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Custom Alert Implementation */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </>
  );
}
