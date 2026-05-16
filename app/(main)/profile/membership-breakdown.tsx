import { CustomAlert } from "@/components/CustomAlert";
import { getMembership } from "@/services/membershipService";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
   * ✅ FETCH MEMBERSHIP
   */
  const fetchMembership = async (showLoader = true, returnData = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const res = await getMembership({
        include: "schedules",
      });

      let mapped: any[] = [];

      if (res?.included) {
        mapped = res.included
          .filter((item: any) => item.type === "api_membership_schedules")
          .map((s: any) => ({
            id: String(s.id),
            amount: Number(s.attributes.amount || 0),
            due_date: s.attributes.due_date,
            status: String(s.attributes.status || "unpaid").toLowerCase(),
            installment: Number(s.attributes.installment_no || 1),
          }))
          .sort((a: any, b: any) => a.installment - b.installment);
      } else if (res?.data?.attributes?.schedules) {
        mapped = res.data.attributes.schedules
          .map((s: any) => ({
            ...s,
            installment: Number(s.installment || 1),
            amount: Number(s.amount || 0),
            status: String(s.status || "unpaid").toLowerCase(),
          }))
          .sort((a: any, b: any) => a.installment - b.installment);
      }

      setSchedules(mapped);

      if (returnData) {
        return mapped;
      }
    } catch (e) {
      console.log("Fetch Error:", e);
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * ✅ SCREEN FOCUS
   */
  useFocusEffect(
    useCallback(() => {
      fetchMembership();

      return () => {};
    }, []),
  );

  /**
   * ✅ REFRESH
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchMembership(false);
  };

  /**
   * ✅ SINGLE PAYMENT
   */
  const isSinglePayment = schedules.length === 1;

  /**
   * ✅ GET NEXT INSTALLMENT
   */
  const nextToPay = useMemo(() => {
    return [...schedules]
      .sort((a, b) => a.installment - b.installment)
      .find((s) => s.status !== "paid");
  }, [schedules]);

  /**
   * ✅ OUTSTANDING
   */
  const outstanding = useMemo(() => {
    return schedules
      .filter((s) => s.status !== "paid")
      .reduce((a, b) => a + Number(b.amount || 0), 0);
  }, [schedules]);

  /**
   * ✅ FULLY PAID
   */
  const isFullyPaid =
    schedules.length > 0 && schedules.every((s) => s.status === "paid");

  /**
   * ✅ HANDLE PAYMENT
   */
  const handlePay = async () => {
    try {
      setCheckingPayment(true);

      /**
       * 🔥 GET LATEST DATABASE DATA
       */
      const updatedSchedules: any = await fetchMembership(false, true);

      /**
       * 🔥 FIND FIRST UNPAID INSTALLMENT
       */
      const latestNextToPay = [...updatedSchedules]
        ?.sort((a: any, b: any) => a.installment - b.installment)
        ?.find((s: any) => s.status !== "paid");

      /**
       * ✅ ALL PAID
       */
      if (!latestNextToPay) {
        setAlert({
          visible: true,
          title: "Success",
          message: "All membership payments are already completed.",
          redirectHome: true,
        });

        return;
      }

      /**
       * ✅ INSTALLMENT ALREADY PAID
       */
      if (latestNextToPay.status === "paid") {
        setAlert({
          visible: true,
          title: "Already Paid",
          message: `Installment ${latestNextToPay.installment} is already paid.`,
          redirectHome: false,
        });

        return;
      }

      /**
       * ✅ SHOW REQUIRED INSTALLMENT
       */
      setAlert({
        visible: true,
        title: "Continue Payment",
        message: `You need to pay Installment ${latestNextToPay.installment} first.`,
        redirectHome: false,
      });

      /**
       * ✅ CONTINUE TO CHECKOUT
       */
      setTimeout(() => {
        router.push({
          pathname: "/profile/membership-checkout",
          params: {
            scheduleId: latestNextToPay.id,
            amount: latestNextToPay.amount,
          },
        });
      }, 500);
    } catch (error) {
      console.log("Payment Check Error:", error);
    } finally {
      setCheckingPayment(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 140,
        }}
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

            const isNext = nextToPay?.installment === item.installment;

            return (
              <View
                key={item.id}
                className="mb-4 bg-white rounded-2xl p-4 border border-slate-100"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center flex-1">
                    {/* STATUS */}
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

                {/* PROGRESS */}
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
          disabled={loading || checkingPayment || schedules.length === 0}
          onPress={handlePay}
          className={`h-16 rounded-2xl justify-center items-center ${
            loading || checkingPayment || schedules.length === 0
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
                  ? `Pay Installment ${nextToPay.installment}`
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
