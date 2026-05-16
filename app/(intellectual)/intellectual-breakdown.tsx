import { CustomAlert } from "@/components/CustomAlert";
import { getIntellectualProperty } from "@/services/intellectualService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function IntellectualBreakdown() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  /**
   * ✅ CUSTOM ALERT
   */
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    redirectHome: false,
  });

  useEffect(() => {
    if (!id) router.replace("/details");
  }, [id]);

  const formatMoney = (value: any) => {
    const num = Number(String(value || "0").replace(/,/g, ""));
    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchSchedules = async (showLoader = true, returnData = false) => {
    try {
      if (!id || typeof id !== "string") return;

      if (showLoader) setLoading(true);

      const res = await getIntellectualProperty(id);

      const included = res?.included || [];

      const mapped = included
        .filter((item: any) => item?.type?.includes("schedule"))
        .map((s: any) => ({
          id: String(s.id),
          amount: Number(s.attributes?.amount || 0),
          due_date: s.attributes?.due_date || null,
          status: String(s.attributes?.status || "unpaid").toLowerCase(),
          installment: Number(s.attributes?.installment_no || 1),
        }))
        .sort((a: any, b: any) => a.installment - b.installment);

      setSchedules(mapped);

      if (returnData) return mapped;
    } catch (e) {
      console.log("Fetch Error:", e);
      setSchedules([]);
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules(false);
  };

  const isSinglePayment = schedules.length === 1;

  /**
   * ✅ STRICT NEXT PAYMENT LOGIC (like membership style)
   */
  const nextToPay = useMemo(() => {
    const unpaid = schedules.filter((s) => s.status !== "paid");

    if (unpaid.length === 0) return null;

    return [...unpaid].sort((a, b) => a.installment - b.installment)[0];
  }, [schedules]);

  /**
   * TOTAL OUTSTANDING
   */
  const outstanding = useMemo(() => {
    return schedules
      .filter((s) => s.status !== "paid")
      .reduce((a, b) => a + Number(b.amount || 0), 0);
  }, [schedules]);

  const isFullyPaid =
    schedules.length > 0 && schedules.every((s) => s.status === "paid");

  /**
   * ✅ HANDLE PAYMENT (same pattern as membership)
   */
  const handlePay = async () => {
    try {
      setCheckingPayment(true);

      const updatedSchedules: any = await fetchSchedules(false, true);

      const unpaid = updatedSchedules?.filter((s: any) => s.status !== "paid");

      const latestNextToPay =
        unpaid?.length > 0
          ? [...unpaid].sort(
              (a: any, b: any) => a.installment - b.installment,
            )[0]
          : null;

      if (!latestNextToPay) {
        setAlert({
          visible: true,
          title: "Success",
          message: "All intellectual property payments are completed.",
          redirectHome: true,
        });
        return;
      }

      if (latestNextToPay.status === "paid") {
        setAlert({
          visible: true,
          title: "Already Paid",
          message: `Installment ${latestNextToPay.installment} is already paid.`,
          redirectHome: false,
        });
        return;
      }

      setAlert({
        visible: true,
        title: "Continue Payment",
        message: `You need to pay Installment ${latestNextToPay.installment} first.`,
        redirectHome: false,
      });

      setTimeout(() => {
        router.push({
          pathname: "/intellectual-checkout",
          params: {
            scheduleId: latestNextToPay.id,
            amount: latestNextToPay.amount,
            mode: isSinglePayment ? "one_time" : "installment",
            intellectualId: String(id),
          },
        });
      }, 500);
    } catch (error) {
      console.log("Payment Error:", error);
    } finally {
      setCheckingPayment(false);
    }
  };

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
        {/* SUMMARY (MATCHED DESIGN) */}
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

        <Text className="font-black text-lg mb-4 px-2">Payment Schedule</Text>

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
            const isNext = nextToPay?.installment === item.installment;

            return (
              <View
                key={item.id}
                className="mb-4 bg-white rounded-2xl p-4 border border-slate-100"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    {isPaid ? (
                      <View className="bg-green-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-green-600 text-[10px] font-bold">
                          PAID
                        </Text>
                      </View>
                    ) : isNext ? (
                      <View className="bg-yellow-100 px-2 py-1 rounded-full mr-3">
                        <Text className="text-yellow-600 text-[10px] font-bold">
                          NEXT TO PAY
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
                        Installment {item.installment}
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
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      <View className="absolute bottom-0 w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          disabled={!nextToPay || loading || checkingPayment}
          onPress={handlePay}
          className={`h-16 rounded-2xl justify-center items-center ${
            !nextToPay || loading || checkingPayment
              ? "bg-slate-300"
              : "bg-primary"
          }`}
        >
          {loading || checkingPayment ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {isFullyPaid
                ? "All Payments Completed"
                : nextToPay
                  ? `Pay ₱${formatMoney(nextToPay.amount)}`
                  : "Fully Paid"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CUSTOM ALERT */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          const shouldRedirect = alert.redirectHome;

          setAlert({
            ...alert,
            visible: false,
          });

          if (shouldRedirect) {
            router.replace("/(main)");
          }
        }}
      />
    </View>
  );
}
