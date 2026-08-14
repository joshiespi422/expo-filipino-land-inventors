import { AgreementModal } from "@/components/AgreementModal";
import { AuthInput } from "@/components/AuthInput";
import { CustomAlert } from "@/components/CustomAlert";
import HeaderAuth from "@/components/HeaderAuth";
import LogoAuth from "@/components/LogoAuth";
import TitleAuth from "@/components/TitleAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { passwordService } from "@/services/passwordService";
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../../global.css";

// Static Terms text defined outside the component lifecycle
const TERMS_AND_CONDITIONS_TEXT = `TERMS AND CONDITIONS OF USE
FILIPINO INVENTORS SOCIETY MULTI-PURPOSE COOPERATIVE (FISMPC) DIGITAL PLATFORM

1. Introduction
Welcome to the FILIPINO INVENTORS SOCIETY MULTI-PURPOSE COOPERATIVE (FISMPC) Digital Platform ("Platform"), owned, operated, and managed by the FILIPINO INVENTORS SOCIETY MULTI-PURPOSE COOPERATIVE (FISMPC) ("FISMPC", "the Cooperative", "we", "our", or "us").

These Terms and Conditions of Use govern your registration, access to, and continued use of the FISMPC Digital Platform, including all current and future services, modules, mobile applications, websites, and online facilities offered by the Cooperative.

The Platform is designed to provide secure and convenient digital services to Cooperative members, applicants, borrowers, customers, inventors, entrepreneurs, and authorized users.

2. Scope of Services
The Platform provides access to the following current and future digital services:
- Business Training Module
- Intellectual Property Assistant
- Loan Application and Loan Management
- Digital Wallet Services
- FISMPC Online Store
- Cooperative Membership Application and Management
- News and Events
- Installment Payment Services
- Online Payments through PayMongo
- Wallet Cash-In and Wallet Payment Transactions
- Member Profile Management
- Notifications
- Messages
- Future digital services that may be introduced by FISMPC

3. Wallet Transactions
The FISMPC Digital Wallet is intended solely for authorized transactions within the Platform.
Users acknowledge and agree that:
- Wallet balances are maintained electronically.
- Wallet funds may only be used for services authorized by FISMPC.
- Cash-ins are subject to successful payment confirmation.
- Wallet funds may be used for purchases, loan payments, membership fees, training fees, and other approved Cooperative transactions.
- Wallet balances are not bank deposits and are not insured by the Philippine Deposit Insurance Corporation (PDIC).
- FISMPC reserves the right to suspend wallet services for suspected fraud, unauthorized transactions, money laundering, or violations of law.

4. PayMongo Online Payments
Users acknowledge that:
- Payments are securely processed by PayMongo.
- FISMPC does not collect or store complete debit card, credit card, or electronic payment credentials.
- Payment confirmations depend on PayMongo and participating financial institutions.
- Failed or reversed transactions due to banks, e-wallet providers, payment gateways, internet interruptions, or force majeure shall not automatically create liability on FISMPC.
- Refund requests are subject to Cooperative policies and applicable Philippine laws.

5. Loans and Obligations
Approved borrowers agree to:
- Pay all amortizations on or before the due date.
- Comply with the repayment schedule approved by the Cooperative.
- Accept penalties and charges for overdue obligations as permitted by Cooperative policies and Philippine law.
- Authorize FISMPC to apply available wallet balances toward outstanding obligations where permitted by applicable agreements and Cooperative policies.

6. Electronic Consent
By clicking "I Agree," "Accept," "Register," "Submit," "Proceed," or by continuing to use the Platform, the User provides a legally binding electronic consent under the Electronic Commerce Act of 2000 (Republic Act No. 8792).

Electronic records, digital signatures, electronic approvals, payment confirmations, and online agreements shall have the same legal force and effect as written documents signed by hand, subject to applicable Philippine laws.

7. Fraud Prevention
FISMPC maintains a zero-tolerance policy against fraud and illegal activities.
The Cooperative may suspend, investigate, restrict, or permanently terminate accounts involved in:
- Identity theft
- False loan applications
- Fake membership information
- Chargeback fraud
- Wallet abuse
- Payment fraud
- Unauthorized account access
- Money laundering
- Cybercrime
- Any activity prohibited under Philippine law

FISMPC reserves the right to cooperate with law enforcement agencies, regulatory authorities, and the courts of the Republic of the Philippines.

8. Contact Information
FILIPINO INVENTORS SOCIETY MULTI-PURPOSE COOPERATIVE (FISMPC)
- Contact Number: (02) 1234-5678.
- Email Address: info@fisinventorscoop.org
- Address: Unit 405, 4th Floor, 821 Cortes Building, EDSA, South Triangle, Quezon City, Philippines.
- Website: https://fismulticoop.org/

9. Acceptance
By creating an account, applying for Cooperative membership, using the Digital Wallet, submitting loan applications, enrolling in Business Training, requesting Intellectual Property Assistance, purchasing products from the FISMPC Online Store, making payments through PayMongo, paying through installment ("Hulugan"), or otherwise accessing or using any feature of the FILIPINO INVENTORS SOCIETY MULTI-PURPOSE COOPERATIVE (FISMPC) Digital Platform, you acknowledge that you have carefully read, understood, and voluntarily agree to be legally bound by these Terms and Conditions of Use, the Privacy Policy, Cooperative policies, and all applicable laws of the Republic of the Philippines.`;

export default function CreatePasswordPage() {
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(0);

  const { phone, token } = useLocalSearchParams<{
    phone: string;
    token: string;
  }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Prevent back action
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

  // Keyboard scroll tracking logic
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      scrollRef.current?.scrollTo({
        y: scrollPosition.current,
        animated: true,
      });
    });

    const hide = Keyboard.addListener("keyboardDidHide", () => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      passwordService.setPassword({
        phone: phone as string,
        password,
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

  const handleCheckboxToggle = () => {
    if (agreeToTerms) {
      setAgreeToTerms(false);
    } else {
      setTermsModalVisible(true);
    }
  };

  const handleAcceptTerms = () => {
    setAgreeToTerms(true);
    setTermsModalVisible(false);
  };

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={(e) => {
          scrollPosition.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View className="flex-1 bg-slate-50">
          <HeaderAuth title="Join Us" />

          <View className="flex-1 -mt-10">
            <View className="bg-primary h-[240px] rounded-b-[60px] absolute w-full top-0" />

            <View className="mx-5 pb-10 max-w-[500px] w-[90%] self-center">
              <View className="bg-white p-6 rounded-[40px] shadow-black/20 shadow-md elevation-4">
                {pageLoading ? (
                  <View className="items-center mb-4">
                    <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />
                  </View>
                ) : (
                  <LogoAuth />
                )}

                {pageLoading ? (
                  <View className="gap-y-6">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-[70px] w-full rounded-2xl" />
                  </View>
                ) : (
                  <>
                    <TitleAuth
                      title="Create Password"
                      description={`Set password for +${phone}`}
                    />

                    <AuthInput
                      label="Password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChangeText={setPassword}
                      editable={!mutation.isPending}
                      isPassword
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />

                    <AuthInput
                      label="Retype Password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!mutation.isPending}
                      isPassword
                      showPassword={showConfirmPassword}
                      onTogglePassword={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />

                    <View className="flex-row ps-2 items-center my-2">
                      <TouchableOpacity
                        onPress={handleCheckboxToggle}
                        className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                          agreeToTerms
                            ? "bg-primary border-primary"
                            : "border-slate-300 bg-slate-50"
                        }`}
                      >
                        {agreeToTerms && (
                          <View className="w-1.5 h-1.5 bg-white rounded-sm" />
                        )}
                      </TouchableOpacity>

                      <Text className="text-primary text-sm flex-1">
                        I agree to the{" "}
                        <Text
                          onPress={() => setTermsModalVisible(true)}
                          className="underline font-bold"
                        >
                          Terms and Conditions
                        </Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleRegister}
                      disabled={mutation.isPending}
                      className={`mt-5 p-5 rounded-2xl flex-row justify-center items-center ${
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

      {/* Custom Alert */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, visible: false });

          if (alert.title === "Session Expired") {
            router.replace("/register");
          }
        }}
      />

      {/* Terms and Conditions Scroll Modal */}
      <AgreementModal
        visible={termsModalVisible}
        title="Terms and Conditions of Use"
        description={TERMS_AND_CONDITIONS_TEXT}
        onAccept={handleAcceptTerms}
        onCancel={() => setTermsModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
