import { AuthInput } from "@/components/AuthInput";
import { CustomAlert } from "@/components/CustomAlert";
import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { passwordService } from "@/services/passwordService";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

export default function CreatePasswordPage() {
  const router = useRouter();
  const { phone, token } = useLocalSearchParams<{
    phone: string;
    token: string;
  }>();

  // Form States
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // UI States
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    Keyboard.dismiss();
    setTimeout(() => {
      setAlert({ visible: true, title, message });
    }, 150);
  };

  // Prevent hardware back button
  useEffect(() => {
    const backAction = () => {
      showAlert(
        "Hold on!",
        "You need to set your password to complete registration.",
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      passwordService.setPassword({
        phone: phone as string,
        password: password,
        password_confirmation: confirmPassword,
        verification_token: token as string,
      }),
    onSuccess: (data) => {
      Keyboard.dismiss();
      router.replace({
        pathname: "/congratulations",
        params: {
          token: data.token,
          user: JSON.stringify(data.user),
        },
      });
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const data = error.response?.data;

      let title = "Error";
      let msg = data?.message || "Failed to complete registration.";

      if (status === 422) {
        title = "Validation Error";
        msg = data?.errors
          ? Object.values(data.errors).flat().join("\n")
          : "Invalid data.";
      } else if (status === 403) {
        title = "Session Expired";
        msg =
          "Your verification token is invalid. Please verify your phone again.";
      }

      showAlert(title, msg);
    },
  });

  const handleRegister = () => {
    if (mutation.isPending) return;

    if (!password || !confirmPassword) {
      return showAlert("Required", "Please fill in both password fields.");
    }
    if (password.length < 8) {
      return showAlert(
        "Security",
        "Password must be at least 8 characters long.",
      );
    }
    if (password !== confirmPassword) {
      return showAlert("Mismatch", "Passwords do not match.");
    }
    if (!agreeToTerms) {
      return showAlert(
        "Agreement",
        "Please agree to the Terms and Conditions to proceed.",
      );
    }

    mutation.mutate();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === "android"}
      >
        <View className="flex-1 bg-slate-50">
          <HeaderAuth title="Join Us" />
          <View className="flex-1 -mt-10">
            <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

            <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
              <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4">
                {pageLoading ? (
                  <View className="items-center mb-4">
                    <View className="mt-[-76px] bg-white rounded-full shadow-sm">
                      <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />
                    </View>
                  </View>
                ) : (
                  <LogoAuth />
                )}

                {pageLoading ? (
                  <View className="gap-y-6">
                    <View className="items-center gap-y-3">
                      <Skeleton className="h-8 w-56 rounded-lg" />
                      <Skeleton className="h-3 w-[70%] rounded-md" />
                    </View>
                    <View className="gap-y-5">
                      <Skeleton className="h-[70px] w-full rounded-2xl" />
                      <Skeleton className="h-[70px] w-full rounded-2xl" />
                    </View>
                    <Skeleton className="h-[64px] w-full rounded-2xl mt-4" />
                  </View>
                ) : (
                  <>
                    <TitleAuth
                      title="Create Password"
                      containerClass="mb-5 mt-4"
                      description={
                        <View>
                          <Text className="text-center text-slate-900 text-sm">
                            Set a password for{" "}
                            <Text className="font-bold">+{phone}</Text> to
                            finish your registration.
                          </Text>
                        </View>
                      }
                    />

                    <View>
                      <AuthInput
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        editable={!mutation.isPending}
                        isPassword={true}
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                      />

                      <AuthInput
                        label="Retype Password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        editable={!mutation.isPending}
                        isPassword={true}
                        showPassword={showConfirmPassword}
                        onTogglePassword={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => setAgreeToTerms(!agreeToTerms)}
                      className="flex-row ps-2 items-center"
                    >
                      <View
                        className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                          agreeToTerms
                            ? "bg-primary border-primary"
                            : "border-slate-300 bg-slate-50"
                        }`}
                      >
                        {agreeToTerms && (
                          <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                        )}
                      </View>
                      <Text className="text-primary text-sm">
                        I agree to the{" "}
                        <Text className="underline font-bold">
                          Terms and Conditions
                        </Text>
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleRegister}
                      disabled={mutation.isPending}
                      className={`mt-5 p-5 rounded-2xl shadow-lg flex-row justify-center items-center ${
                        mutation.isPending ? "bg-slate-400" : "bg-primary"
                      }`}
                    >
                      {mutation.isPending ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-bold text-lg">
                          Complete Registration
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          if (alert.title === "Session Expired") router.replace("/register");
        }}
      />
    </>
  );
}
