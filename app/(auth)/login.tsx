import { authService } from "@/services/authService";
import { biometricService } from "@/services/biometricService";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Components
import { AuthInput } from "@/components/AuthInput";
import { CustomAlert } from "@/components/CustomAlert";
import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import { LoginSkeleton } from "@/components/LoginSkeleton";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import "../../global.css";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const scrollRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(0);

  const [form, setForm] = useState({ number: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [biometricAlert, setBiometricAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [loadingState, setLoadingState] = useState({
    page: true,
    action: false,
    nav: false,
    biometric: false,
  });

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometryLabel, setBiometryLabel] = useState<string>("Biometrics");
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
  const [hasBiometricEnabled, setHasBiometricEnabled] = useState(false);

  const isProcessing = useRef(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setLoadingState((prev) => ({ ...prev, page: false })),
      400,
    );
    return () => clearTimeout(timer);
  }, []);

  // Initialize biometric support
  useEffect(() => {
    const initBiometric = async () => {
      try {
        // Check biometric support
        const { available, biometryType } =
          await biometricService.isSupported();
        setBiometricAvailable(available);
        setBiometryLabel(biometricService.getBiometryLabel(biometryType));

        // Get device ID
        const deviceId = await biometricService.getDeviceId();
        setCurrentDeviceId(deviceId);

        // Check if user has biometric enabled
        if (available) {
          const publicKey = await biometricService.createKeys();
          setHasBiometricEnabled(!!publicKey);
        }
      } catch (error) {
        console.error("Biometric initialization error:", error);
      }
    };

    initBiometric();
  }, []);

  // 🔥 SAVE POSITION WHEN KEYBOARD OPENS
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollTo({
        y: scrollPosition.current,
        animated: true,
      });
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      // 🔥 restore to top smoothly when keyboard closes
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const showAlert = (title: string, message: string) => {
    setAlert({ visible: true, title, message });
  };

  const showBiometricAlert = (title: string, message: string) => {
    setBiometricAlert({ visible: true, title, message });
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

  const handleBiometricLogin = async () => {
    if (
      isProcessing.current ||
      loadingState.action ||
      loadingState.nav ||
      loadingState.biometric
    )
      return;

    if (!biometricAvailable) {
      showBiometricAlert(
        "Not Supported",
        "Biometric authentication is not available on this device.",
      );
      return;
    }

    if (!hasBiometricEnabled) {
      showBiometricAlert(
        "Not Enabled",
        "Please enable biometric login in your security settings first.",
      );
      return;
    }

    isProcessing.current = true;
    setLoadingState((prev) => ({ ...prev, biometric: true }));

    try {
      // Prompt biometric authentication
      const authenticated = await biometricService.promptBiometrics(
        `Authenticate with ${biometryLabel} to login`,
      );

      if (!authenticated) {
        isProcessing.current = false;
        setLoadingState((prev) => ({ ...prev, biometric: false }));
        return;
      }

      // Get public key
      const publicKey = await biometricService.createKeys();

      // Attempt biometric login
      const data = await authService.biometricLogin(currentDeviceId, publicKey);
      await setAuth(data.token, data.user);

      setLoadingState((prev) => ({ ...prev, nav: true }));
      router.replace("/(main)");
    } catch (error: any) {
      let msg = "Biometric login failed. Please try again.";

      if (error?.errors) {
        const errorValues = Object.values(error.errors);
        msg = Array.isArray(errorValues[0])
          ? errorValues[0][0]
          : String(errorValues[0]);
      } else if (error?.message) {
        msg = error.message;
      }

      showBiometricAlert("Login Failed", msg);

      isProcessing.current = false;
      setLoadingState((prev) => ({ ...prev, biometric: false }));
    }
  };

  const handleForgotPassword = () => {
    if (isDisabled) return;
    router.push("/forgetPassword");
  };

  const isDisabled = loadingState.action || loadingState.nav;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={(e) => {
          scrollPosition.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View className="flex-1 bg-slate-50">
          <HeaderAuth title="Hello" subtitle="Welcome back!" />

          <View className="flex-1 -mt-10">
            <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

            <View className="mx-5 pb-10 pt-5 max-w-[500px] w-[90%] self-center">
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

                    {/* --- BIOMETRIC LOGIN BUTTON --- */}
                    {biometricAvailable && hasBiometricEnabled && (
                      <TouchableOpacity
                        onPress={handleBiometricLogin}
                        disabled={isDisabled || loadingState.biometric}
                        activeOpacity={0.8}
                        className={`mb-4 p-4 rounded-2xl flex-row justify-center items-center border-2 ${
                          isDisabled || loadingState.biometric
                            ? "border-slate-300 bg-slate-50"
                            : "border-primary bg-primary/5"
                        }`}
                      >
                        {loadingState.biometric ? (
                          <ActivityIndicator color="#034194" />
                        ) : (
                          <>
                            <Ionicons
                              name="finger-print"
                              size={20}
                              color="#034194"
                              style={{ marginRight: 8 }}
                            />
                            <Text className="text-primary font-bold text-base">
                              Login with {biometryLabel}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* --- DIVIDER --- */}
                    {biometricAvailable && hasBiometricEnabled && (
                      <View className="flex-row items-center mb-4">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="px-3 text-gray-400 text-xs">OR</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                      </View>
                    )}

                    <AuthInput
                      label="Mobile Number"
                      placeholder="09123456789"
                      value={form.number}
                      onChangeText={(val) => setForm({ ...form, number: val })}
                      keyboardType="phone-pad"
                      editable={!isDisabled}
                    />

                    {/* 🔥 PASSED PROPS TO TRIGGER THE INTEGRATED FORGOT PASSWORD LINK */}
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
                      hasForgotPassword={true}
                      onForgotPassword={handleForgotPassword}
                    />

                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                      className={`mt-3 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
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
                        setLoadingState((p) => ({
                          ...p,
                          nav: val,
                        }))
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

      {/* --- REGULAR LOGIN ALERT --- */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />

      {/* --- BIOMETRIC LOGIN ALERT --- */}
      <CustomAlert
        visible={biometricAlert.visible}
        title={biometricAlert.title}
        message={biometricAlert.message}
        onClose={() => setBiometricAlert({ ...biometricAlert, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}
