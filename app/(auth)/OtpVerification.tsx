import { CustomAlert } from "@/components/CustomAlert"; // Added
import HeaderAuth from "@/components/HeaderAuth";
import LinkAuth from "@/components/LinkAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { phoneVerificationService } from "@/services/phoneVerification";
import { useMutation } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import OTPVerification from "../../assets/images/vector/OTPVerificationCode.png";
import "../../global.css";

// Memoized individual digit box for performance
const OtpInputBox = memo(function OtpInputBox({
  digit,
  isFocused,
}: {
  digit: string;
  isFocused: boolean;
}) {
  return (
    <View
      className={`w-[14%] h-14 border-2 rounded-xl justify-center items-center bg-slate-50 ${
        isFocused ? "border-primary" : "border-slate-200"
      }`}
    >
      <Text className="text-primary text-2xl font-bold">{digit}</Text>
    </View>
  );
});

export default function OtpVerificationPage() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  // States
  const [otp, setOtp] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const inputRef = useRef<TextInput>(null);

  // Alert State
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (title: string, message: string) => {
    setAlert({ visible: true, title, message });
  };

  // Reset internal navigation states when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
    }, []),
  );

  // Initial loading and countdown logic
  useEffect(() => {
    const loadTimer = setTimeout(() => setPageLoading(false), 400);

    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(countdown);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // --- MUTATIONS ---

  // Verify OTP Mutation
  const verifyMutation = useMutation({
    mutationFn: (otpCode: string) =>
      phoneVerificationService.verify({
        phone: phone as string,
        otp_code: otpCode,
      }),
    onSuccess: (data) => {
      setNavigating(true);
      router.push({
        pathname: "/createPassword",
        params: { token: data.verification_token, phone },
      });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Invalid OTP code. Please try again.";

      if (error.status === 429) {
        showAlert(
          "Too Many Attempts",
          "You have tried too many times. Please wait a minute before trying again.",
        );
      } else {
        showAlert("Verification Failed", message);
      }

      setOtp(""); // Clear input on error to let them retry
    },
  });

  // Resend OTP Mutation
  const resendMutation = useMutation({
    mutationFn: () =>
      phoneVerificationService.resend({ phone: phone as string }),
    onSuccess: (data) => {
      setTimer(300); // Reset timer to 5 mins
      showAlert(
        "OTP Sent",
        data.message || "A new verification code has been sent to your device.",
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Too many requests. Please wait.";
      showAlert("Resend Error", message);
    },
  });

  const handleVerify = () => {
    if (otp.length === 6 && !verifyMutation.isPending) {
      verifyMutation.mutate(otp);
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-slate-50">
          <HeaderAuth title="Join Us" />

          <View className="flex-1 -mt-10">
            <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

            <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
              <View className="bg-white p-6 rounded-[40px] shadow-md elevation-4">
                {pageLoading ? (
                  <View className="items-center mb-4">
                    <Skeleton className="w-32 h-32 rounded-full mt-[-76px] border-4 border-white" />
                  </View>
                ) : (
                  <LogoAuth />
                )}

                {pageLoading ? (
                  <View className="gap-y-6">
                    <Skeleton className="w-40 h-48 self-center mt-3" />
                    <Skeleton className="h-8 w-56 self-center" />
                    <View className="flex-row justify-between px-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="w-[14%] h-14 rounded-xl" />
                      ))}
                    </View>
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </View>
                ) : (
                  <>
                    <Image
                      source={OTPVerification}
                      className="w-40 h-48 self-center"
                      resizeMode="contain"
                    />

                    <TitleAuth
                      title="OTP Verification"
                      containerClass="mb-5 mt-4"
                      description={
                        <Text className="text-center text-slate-500 text-sm">
                          Enter the OTP sent to{" "}
                          <Text className="font-bold text-slate-800">
                            {phone ? `+${phone}` : "+63 9XX XXX XXXX"}
                          </Text>
                        </Text>
                      }
                    />

                    {/* OTP INPUT SECTION */}
                    <View className="relative">
                      <TextInput
                        ref={inputRef}
                        value={otp}
                        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ""))}
                        maxLength={6}
                        keyboardType="number-pad"
                        autoFocus
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          zIndex: 1,
                        }}
                      />
                      <Pressable
                        onPress={() => inputRef.current?.focus()}
                        className="flex-row justify-between items-center px-2"
                      >
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <OtpInputBox
                            key={i}
                            digit={otp[i] || ""}
                            isFocused={otp.length === i}
                          />
                        ))}
                      </Pressable>
                    </View>

                    <TouchableOpacity
                      onPress={handleVerify}
                      disabled={
                        verifyMutation.isPending || navigating || otp.length < 6
                      }
                      className={`mt-5 p-5 rounded-2xl flex-row justify-center items-center ${
                        otp.length < 6 || verifyMutation.isPending || navigating
                          ? "bg-slate-300"
                          : "bg-primary"
                      }`}
                    >
                      {verifyMutation.isPending ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-bold text-lg">
                          {navigating ? "Verifying..." : "Verify OTP"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* RESEND SECTION */}
                    <View className="mt-6 items-center">
                      <Text className="text-slate-500 font-medium">
                        Didn{"'"}t receive code?
                      </Text>
                      {timer > 0 ? (
                        <Text className="text-slate-400 mt-1">
                          Resend available in {formatTime(timer)}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => resendMutation.mutate()}
                          disabled={resendMutation.isPending}
                        >
                          {resendMutation.isPending ? (
                            <ActivityIndicator
                              size="small"
                              color="#000"
                              className="mt-1"
                            />
                          ) : (
                            <Text className="text-primary font-bold underline mt-1">
                              Resend Code
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    <LinkAuth
                      onNavigating={setNavigating}
                      isNavigating={navigating}
                    />
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Global Styled Alert */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </>
  );
}
