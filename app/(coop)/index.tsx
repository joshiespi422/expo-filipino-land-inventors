import { profileService } from "@/services/profileService";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

export default function CooperativeMembershipPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedYear, setSelectedYear] = useState("2026");
  const [showYearModal, setShowYearModal] = useState(false);

  const years = ["2026", "2025", "2024"];

  // --- MEMBERSHIP / STATUS FLAGS (same pattern as ProfileScreen) ---
  const userTypeName = user?.user_type?.name?.toUpperCase() || "";
  const statusName = user?.status?.name?.toLowerCase() || "";

  const isBasic = userTypeName === "BASIC";
  const isMember = userTypeName === "MEMBER";
  const isActive = statusName === "active";
  const isApproved = statusName === "approved";
  const isForApproval = statusName === "for_approval";

  // Only fully active Members can view cooperative transparency
  const hasAccess = isMember && isActive;

  // YEARLY COOPERATIVE DATA
  const yearlyData: any = {
    "2026": {
      totalFund: "₱1,500,000",
      transactions: [
        {
          title: "Membership Contribution",
          description:
            "Total membership fees collected from members and added to the cooperative fund.",
          amount: "₱500,000",
        },
        {
          title: "Cooperative Earnings",
          description:
            "Income generated from cooperative services, investments, and activities.",
          amount: "₱700,000",
        },
        {
          title: "Member Returns",
          description:
            "Amount prepared for member benefits and cooperative sharing.",
          amount: "₱300,000",
        },
      ],
      allocation: [
        {
          name: "Member Returns",
          description:
            "Funds distributed back to members as benefits and cooperative earnings sharing.",
          percentage: "40%",
          amount: "₱600,000",
        },
        {
          name: "Operations",
          description:
            "Funds used for daily cooperative management, maintenance, and administration.",
          percentage: "30%",
          amount: "₱450,000",
        },
        {
          name: "Community Projects",
          description:
            "Funds allocated for community support programs and cooperative projects.",
          percentage: "20%",
          amount: "₱300,000",
        },
        {
          name: "Emergency Reserve",
          description:
            "Saved funds for unexpected expenses and cooperative security.",
          percentage: "10%",
          amount: "₱150,000",
        },
      ],
    },
    "2025": {
      totalFund: "₱1,200,000",
      transactions: [
        {
          title: "Membership Contribution",
          description: "Total member contributions collected during the year.",
          amount: "₱400,000",
        },
        {
          title: "Cooperative Earnings",
          description: "Profit generated from cooperative activities.",
          amount: "₱500,000",
        },
        {
          title: "Member Returns",
          description: "Returned earnings distributed to cooperative members.",
          amount: "₱300,000",
        },
      ],
      allocation: [
        {
          name: "Member Returns",
          description: "Member profit sharing and cooperative benefits.",
          percentage: "40%",
          amount: "₱480,000",
        },
        {
          name: "Operations",
          description: "Administrative and operational expenses.",
          percentage: "30%",
          amount: "₱360,000",
        },
        {
          name: "Community Projects",
          description: "Budget for cooperative community programs.",
          percentage: "20%",
          amount: "₱240,000",
        },
        {
          name: "Emergency Reserve",
          description: "Reserved cooperative emergency fund.",
          percentage: "10%",
          amount: "₱120,000",
        },
      ],
    },
    "2024": {
      totalFund: "₱900,000",
      transactions: [
        {
          title: "Membership Contribution",
          description:
            "Member fees collected and recorded for cooperative growth.",
          amount: "₱300,000",
        },
        {
          title: "Cooperative Earnings",
          description: "Annual earnings from cooperative operations.",
          amount: "₱400,000",
        },
        {
          title: "Member Returns",
          description: "Benefits returned to cooperative members.",
          amount: "₱200,000",
        },
      ],
      allocation: [
        {
          name: "Member Returns",
          description: "Funds allocated for member benefits and rewards.",
          percentage: "40%",
          amount: "₱360,000",
        },
        {
          name: "Operations",
          description: "Funds for cooperative maintenance and management.",
          percentage: "30%",
          amount: "₱270,000",
        },
        {
          name: "Community Projects",
          description: "Funds for community development programs.",
          percentage: "20%",
          amount: "₱180,000",
        },
        {
          name: "Emergency Reserve",
          description: "Emergency savings allocation.",
          percentage: "10%",
          amount: "₱90,000",
        },
      ],
    },
  };

  const currentData = yearlyData[selectedYear];

  const fetchProfile = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await profileService.getProfile();
      setUser(data);
    } catch (error) {
      console.error("Profile Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(true);
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#034194" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View className="px-6 py-10">
          <Text className="text-primary text-3xl font-bold">
            Cooperative Transparency
          </Text>

          <Text className="text-slate-500 mt-3 mb-8">
            View yearly membership contribution, cooperative earnings, and fund
            allocation.
          </Text>

          {/* --- GATE: BASIC & ACTIVE (profile not yet completed) --- */}
          {isBasic && isActive && (
            <View className="bg-orange-50 border border-orange-200 p-5 rounded-[30px] mb-8">
              <View className="flex-row items-center">
                <View className="bg-[#C6890F] p-2 rounded-full">
                  <Ionicons name="warning" size={20} color="white" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-[#C6890F] font-bold text-lg">
                    Complete Your Profile
                  </Text>
                </View>
              </View>

              <Text className="text-[#C6890F] text-sm mt-2 leading-5">
                To view cooperative transparency, you need to complete your
                profile, address, and a valid ID first, then get approved as a
                Member.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/profile/setupProfile")}
                className="bg-[#C6890F] mt-4 py-3 rounded-2xl items-center flex-row justify-center"
              >
                <Text className="text-white font-bold text-base mr-2">
                  Complete Now
                </Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* --- GATE: BASIC & FOR APPROVAL (pending review) --- */}
          {isBasic && isForApproval && (
            <View className="bg-blue border border-primary p-5 rounded-[30px] mb-8">
              <View className="flex-row items-center">
                <View className="bg-primary p-2 rounded-full">
                  <Ionicons name="time" size={20} color="white" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-primary font-bold text-lg">
                    Review in Progress
                  </Text>
                </View>
              </View>

              <Text className="text-primary text-sm mt-2 leading-5">
                Your account details have been submitted. Please wait 2-3 days
                for approval before cooperative transparency becomes available.
              </Text>
            </View>
          )}

          {/* --- GATE: BASIC & APPROVED (needs capital contribution) --- */}
          {isBasic && isApproved && (
            <View className="bg-green-50 border border-green-200 p-5 rounded-[30px] mb-8">
              <View className="flex-row items-center">
                <View className="bg-green-600 p-2 rounded-full">
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={20}
                    color="white"
                  />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-green-800 font-bold text-lg">
                    Capital Contribution
                  </Text>
                </View>
              </View>

              <Text className="text-green-700 text-sm mt-2 leading-5">
                To view cooperative transparency, you need to contribute to the
                initial share capital. You can choose{" "}
                <Text className="font-bold">installment</Text> or{" "}
                <Text className="font-bold">full payment</Text> now.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/profile/membership")}
                className="bg-green-600 mt-4 py-3 rounded-2xl items-center flex-row justify-center"
              >
                <Text className="text-white font-bold text-base mr-2">
                  Pay Contribution
                </Text>
                <Ionicons name="card-outline" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* --- FULL CONTENT: MEMBER & ACTIVE ONLY --- */}
          {hasAccess ? (
            <>
              {/* TOTAL FUND */}
              <View className="bg-slate-50 border border-slate-200 rounded-2xl p-6 items-center mb-8">
                <Text className="text-slate-500">
                  TOTAL COOPERATIVE FUND {selectedYear}
                </Text>
                <Text className="text-4xl font-black mt-2">
                  {currentData.totalFund}
                </Text>
              </View>

              {/* YEAR SELECT */}
              <Text className="font-bold text-xl mb-3">Select Year</Text>

              <TouchableOpacity
                onPress={() => setShowYearModal(true)}
                className="bg-slate-100 p-5 rounded-xl mb-8"
              >
                <Text className="font-bold">{selectedYear}</Text>
              </TouchableOpacity>

              {/* TRANSACTIONS */}
              <Text className="text-xl font-bold mb-4">Membership Records</Text>

              <View className="gap-y-4">
                {currentData.transactions.map((item: any, index: number) => (
                  <View
                    key={index}
                    className="border border-slate-200 rounded-xl p-5"
                  >
                    <View className="flex-row justify-between">
                      <Text className="font-bold text-slate-700 flex-1">
                        {item.title}
                      </Text>
                      <Text className="font-black text-primary">
                        {item.amount}
                      </Text>
                    </View>
                    <Text className="text-slate-500 mt-2">
                      {item.description}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-3">
                      Year {selectedYear}
                    </Text>
                  </View>
                ))}
              </View>

              {/* ALLOCATION */}
              <Text className="text-xl font-bold mt-10 mb-4">
                Fund Allocation
              </Text>

              <View className="gap-y-4">
                {currentData.allocation.map((item: any, index: number) => (
                  <View
                    key={index}
                    className="border border-slate-200 rounded-xl p-5"
                  >
                    <View className="flex-row justify-between">
                      <Text className="font-bold text-slate-700">
                        {item.name}
                      </Text>
                      <Text className="font-black text-primary">
                        {item.percentage}
                      </Text>
                    </View>
                    <Text className="text-slate-500 mt-2">
                      {item.description}
                    </Text>
                    <Text className="font-bold mt-3">{item.amount}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View className="items-center py-10">
              <Ionicons name="lock-closed-outline" size={40} color="#CBD5E1" />
              <Text className="text-slate-400 font-semibold mt-3 text-center">
                Cooperative transparency is available once your profile is
                complete and your Member status is active.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* YEAR MODAL — only relevant if user has access, but harmless to keep mounted */}
      <Modal visible={showYearModal} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center px-8">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-xl font-bold mb-5">Choose Year</Text>

            {years.map((year) => (
              <TouchableOpacity
                key={year}
                onPress={() => {
                  setSelectedYear(year);
                  setShowYearModal(false);
                }}
                className="bg-slate-100 rounded-xl p-4 mb-3"
              >
                <Text className="text-center font-bold">{year}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setShowYearModal(false)}>
              <Text className="text-center text-red-500 font-bold mt-3">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
