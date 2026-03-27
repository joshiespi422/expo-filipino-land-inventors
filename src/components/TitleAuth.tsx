import { usePathname } from "expo-router"; // Added this import
import { Text, View } from "react-native";
import "../../global.css";

export default function TitleAuth() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isOtpSendPage = pathname === "/otpSend";
  const isSuccessVerificationPage = pathname === "/SuccessVerification";
  const isCreatePasswordPage = pathname === "/CreatePassword";
  const isCongratulationsPage = pathname === "/congratulations";

  return (
    <View>
      {/* Logic for Login Page */}
      {isLoginPage && (
        <View className="mb-8 mt-2">
          <Text className="text-3xl font-bold text-primary text-center">
            Login Account
          </Text>
          <Text className="text-center text-slate-800 mt-2 text-sm">
            Log in to your account to securely access
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            your dashboard, manage your information,
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            and use all available features.
          </Text>
        </View>
      )}

      {/* Logic for Register Page */}
      {isRegisterPage && (
        <View className="mb-8 mt-2">
          <Text className="text-3xl font-bold text-primary text-center">
            Register Account
          </Text>
          <Text className="text-center text-slate-800 mt-2 text-sm">
            Create an Account to get started
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            and access our services
          </Text>
        </View>
      )}

      {isOtpSendPage && (
        <View className="mb-5 mt-4">
          <Text className="text-3xl font-bold text-primary text-center">
            OTP Verification
          </Text>
          <Text className="text-center text-slate-800 mt-1 text-sm">
            We will send you a{" "}
            <Text className="font-bold">One Time Password</Text>
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            on this mobile number
          </Text>
        </View>
      )}

      {isSuccessVerificationPage && (
        <View className="mb-5 mt-4">
          <Text className="text-3xl font-bold text-primary text-center">
            Success!!!
          </Text>
          <Text className="text-center text-slate-800 mt-1 text-sm">
            Congratulations you have been
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            successfully Verified.
          </Text>
        </View>
      )}

      {isCreatePasswordPage && (
        <View className="mb-5 mt-4">
          <Text className="text-3xl font-bold text-primary text-center">
            Create Password
          </Text>
          <Text className="text-center text-slate-800 mt-1 text-sm">
            Create a secure password to
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            protect your account.
          </Text>
        </View>
      )}
      {isCongratulationsPage && (
        <View className="mb-5 mt-4">
          <Text className="text-3xl font-bold text-primary text-center">
            Congratulations!!!
          </Text>
          <Text className="text-center text-slate-800 mt-1 text-sm">
            Your Account has been successfully
          </Text>
          <Text className="text-center text-slate-800 text-sm">
            kindly{" "}
            <Text className="font-bold">
              proceed to your profile to complete
            </Text>
          </Text>
          <Text className="text-center font-bold text-slate-800 text-sm">
            Verification <Text className="font-light">and</Text> gain full
            access
          </Text>
          <Text className="text-center font-bold text-slate-800 text-sm">
            to our services
          </Text>
        </View>
      )}
    </View>
  );
}
