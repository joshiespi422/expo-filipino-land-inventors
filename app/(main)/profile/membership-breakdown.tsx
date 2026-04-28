import { getMembership } from "@/services/membershipService";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MembershipBreakdown() {
  const router = useRouter();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 💰 FORMAT MONEY
   */
  const formatMoney = (value: any) => {
    const num = Number(value || 0);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * 📅 FORMAT DATE
   */
  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * FETCH DATA
   */
  const fetchMembership = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const res = await getMembership({ include: "schedules" });

      let mapped: any[] = [];

      if (res?.included) {
        mapped = res.included
          .filter((item: any) => item.type === "api_membership_schedules")
          .map((s: any) => ({
            id: String(s.id),
            amount: Number(s.attributes.amount || 0),
            due_date: s.attributes.due_date,
            status: (s.attributes.status || "unpaid").toLowerCase(),
            installment: Number(s.attributes.installment_no || 1),
          }))
          .sort((a: any, b: any) => a.installment - b.installment);
      } else if (res?.data?.attributes?.schedules) {
        mapped = res.data.attributes.schedules;
      }

      setSchedules(mapped);
    } catch (e) {
      console.log("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembership(false);
  };

  /**
   * 📌 LOGIC
   */
  const isSinglePayment = schedules.length === 1;

  const nextToPay = useMemo(
    () =>
      schedules.find(
        (s) =>
          s.status === "unpaid" ||
          s.status === "overdue" ||
          s.status === "approved",
      ),
    [schedules],
  );

  const outstanding = useMemo(
    () =>
      schedules
        .filter((s) => s.status !== "paid")
        .reduce((a, b) => a + (b.amount || 0), 0),
    [schedules],
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#034194"]}
            tintColor="#034194"
          />
        }
      >
        {/* SUMMARY */}
        <View className="bg-white rounded-3xl p-6 mb-6">
          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text className="text-slate-400 text-xs font-bold uppercase">
                {isSinglePayment ? "Membership Fee" : "Outstanding Balance"}
              </Text>
              <Text className="text-primary text-3xl font-black mt-1">
                ₱{formatMoney(outstanding)}
              </Text>
            </>
          )}
        </View>

        <Text className="font-black text-lg mb-4 px-2">
          {isSinglePayment ? "Payment Details" : "Payment Schedule"}
        </Text>

        {/* LIST */}
        {loading ? (
          <ActivityIndicator className="mt-10" />
        ) : schedules.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            No schedules found.
          </Text>
        ) : (
          schedules.map((item) => {
            const isPaid = item.status === "paid";
            const isNext = nextToPay?.id === item.id;

            return (
              <View
                key={item.id}
                className="mb-4 bg-white rounded-2xl p-4 border border-slate-100"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    {/* STATUS BADGE */}
                    {isPaid ? (
                      <View className="bg-green-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-green-600 text-[10px] font-bold">
                          PAID
                        </Text>
                      </View>
                    ) : isNext ? (
                      <View className="bg-yellow-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-yellow-600 text-[10px] font-bold">
                          NEXT
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-slate-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-slate-500 text-[10px] font-bold">
                          PENDING
                        </Text>
                      </View>
                    )}

                    <View>
                      <Text className="font-bold text-slate-800">
                        {isSinglePayment
                          ? "Membership Payment"
                          : `Installment ${item.installment}`}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        Due {formatDate(item.due_date)}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-black text-primary text-base">
                    ₱{formatMoney(item.amount)}
                  </Text>
                </View>

                {/* PROGRESS BAR (ONLY FOR MULTIPLE) */}
                {!isSinglePayment && (
                  <View className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className={`h-full ${
                        isPaid
                          ? "bg-green-500 w-full"
                          : isNext
                            ? "bg-yellow-400 w-2/3"
                            : "bg-slate-300 w-1/3"
                      }`}
                    />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          disabled={!nextToPay || loading}
          onPress={() =>
            router.push({
              pathname: "/profile/membership-checkout",
              params: {
                scheduleId: nextToPay?.id,
                amount: nextToPay?.amount,
              },
            })
          }
          className={`h-16 rounded-2xl justify-center items-center ${
            !nextToPay || loading ? "bg-slate-300" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {nextToPay
                ? `Pay ₱${formatMoney(nextToPay.amount)}`
                : "Fully Paid"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
