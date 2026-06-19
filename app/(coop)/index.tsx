import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

export default function CooperativeMembershipPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedYear, setSelectedYear] = useState("2026");

  const [showYearModal, setShowYearModal] = useState(false);

  const years = ["2026", "2025", "2024"];

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

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 600);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  }, []);

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

          {/* TRANSACTION */}

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

                  <Text className="font-black text-primary">{item.amount}</Text>
                </View>

                <Text className="text-slate-500 mt-2">{item.description}</Text>

                <Text className="text-xs text-slate-400 mt-3">
                  Year {selectedYear}
                </Text>
              </View>
            ))}
          </View>

          {/* ALLOCATION */}

          <Text className="text-xl font-bold mt-10 mb-4">Fund Allocation</Text>

          <View className="gap-y-4">
            {currentData.allocation.map((item: any, index: number) => (
              <View
                key={index}
                className="border border-slate-200 rounded-xl p-5"
              >
                <View className="flex-row justify-between">
                  <Text className="font-bold text-slate-700">{item.name}</Text>

                  <Text className="font-black text-primary">
                    {item.percentage}
                  </Text>
                </View>

                <Text className="text-slate-500 mt-2">{item.description}</Text>

                <Text className="font-bold mt-3">{item.amount}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* YEAR MODAL */}

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
