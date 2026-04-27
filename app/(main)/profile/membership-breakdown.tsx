import { getMembership } from "@/services/membershipService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MembershipBreakdown() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]); // This is plural
  const [loading, setLoading] = useState(true);

  const fetchMembership = async () => {
    try {
      const res = await getMembership({ include: "schedules" });

      if (res?.included) {
        const scheduleData = res.included
          .filter((item: any) => item.type === "api_membership_schedules")
          .map((s: any) => ({
            id: s.id,
            amount: s.attributes.amount,
            due_date: s.attributes.due_date,
            status: (s.attributes.status || "").toLowerCase(),
            installment: s.attributes.installment_no,
          }))
          .sort((a: any, b: any) => a.installment - b.installment);

        setSchedules(scheduleData); // Fixed: was setSchedule
      } else if (res?.data?.attributes?.schedules) {
        setSchedules(res.data.attributes.schedules); // Fixed: was setSchedule
      }
    } catch (e) {
      console.log("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const nextToPay = schedules.find(
    (s) =>
      s.status === "unpaid" ||
      s.status === "overdue" ||
      s.status === "approved",
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="p-4">
        <Text className="text-xl font-bold mb-4">Payment Schedule</Text>
        {loading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : schedules.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No schedules found.
          </Text>
        ) : (
          schedules.map((item) => (
            <View
              key={item.id}
              className="bg-white p-4 rounded-xl mb-3 border border-gray-200"
            >
              <View className="flex-row justify-between">
                <Text className="font-bold text-lg">₱{item.amount}</Text>
                <Text
                  className={`font-bold uppercase ${
                    item.status === "paid"
                      ? "text-green-600"
                      : "text-orange-500"
                  }`}
                >
                  {item.status}
                </Text>
              </View>
              <Text className="text-gray-500">Due: {item.due_date}</Text>
              <Text className="text-xs text-slate-400 mt-1">
                Installment #{item.installment}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View className="p-5 bg-white border-t border-gray-100">
        <TouchableOpacity
          disabled={!nextToPay}
          onPress={() =>
            router.push({
              pathname: "/profile/membership-checkout",
              params: { scheduleId: nextToPay.id, amount: nextToPay.amount },
            })
          }
          className={`h-14 rounded-xl justify-center items-center ${
            !nextToPay ? "bg-gray-300" : "bg-primary"
          }`}
        >
          <Text className="text-white font-bold">
            {nextToPay ? `Pay Now (₱${nextToPay.amount})` : "Fully Paid"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
