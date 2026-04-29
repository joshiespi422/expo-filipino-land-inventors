import { Skeleton } from "@/components/ui/skeleton";
import { getIntellectualProperty } from "@/services/intellectualService";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import "../../global.css";

export default function DetailsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const isProcessing = useRef(false);
  const [navigating, setNavigating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      isProcessing.current = false;
      setNavigating(false);
      fetchDetails();
    }, [id]),
  );

  const fetchDetails = async () => {
    try {
      setLoading(true);

      const res = await getIntellectualProperty(id as string);
      setData(res.data);
    } catch (error: any) {
      console.log("❌ ERROR:", error?.response?.data || error);
    } finally {
      setLoading(false);
      setRefreshing(false); // ✅ stop refresh spinner
    }
  };

  /**
   * 🔄 REFRESH (ADDED ONLY)
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails();
  }, [id]);

  const attr = data?.attributes ?? {};
  const claims = data?.claims || [];
  const documents = data?.documents || [];
  const schedules = data?.schedules || [];
  const payments = data?.payments || [];

  const isPayment = attr?.form_type?.toLowerCase?.() === "payment";

  const handleBack = () => {
    if (isProcessing.current || navigating) return;
    isProcessing.current = true;
    setNavigating(true);
    router.back();
  };

  const StatusBadge = ({ status }: any) => {
    const color =
      status === "Registered"
        ? "bg-green-100 text-green-700"
        : status === "Pending"
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-700";

    return (
      <View className={`px-3 py-1 rounded-full ${color}`}>
        <Text className="text-[10px] font-bold uppercase">{status}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#034194"]}
            tintColor="#034194"
          />
        }
      >
        <View className="items-center pb-10 px-5">
          <View className="w-full max-w-[500px] mx-auto pt-7">
            {/* HEADER */}
            {loading ? (
              <Skeleton className="h-10 w-64 self-center mb-6" />
            ) : (
              <Text className="text-center text-primary font-bold text-3xl mb-6">
                Property Details
              </Text>
            )}

            {/* MAIN CARD */}
            <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              {loading ? (
                <Skeleton className="h-5 w-24 mb-4" />
              ) : (
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    Ref ID: #{data?.id}
                  </Text>

                  <View
                    className={`px-3 py-1 rounded-full ${
                      attr.status === "registered"
                        ? "bg-green-100"
                        : attr.status === "pending"
                          ? "bg-amber-100"
                          : "bg-[#FFE6E9]"
                    }`}
                  >
                    <Text
                      className={`font-bold text-[10px] uppercase ${
                        attr.status === "registered"
                          ? "text-green-700"
                          : attr.status === "pending"
                            ? "text-amber-700"
                            : "text-[#D70127]"
                      }`}
                    >
                      {attr.status}
                    </Text>
                  </View>
                </View>
              )}

              {loading ? (
                <Skeleton className="h-8 w-40 mb-3" />
              ) : (
                <Text className="text-xl font-bold text-slate-800 mb-2">
                  {attr.title}
                </Text>
              )}

              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <Text className="text-slate-500 text-sm leading-relaxed">
                  {attr.description}
                </Text>
              )}

              {!loading && attr.applicability && (
                <View className="mt-4 bg-slate-50 p-4 rounded-2xl">
                  <Text className="text-slate-400 text-xs uppercase font-bold mb-1">
                    Industrial Use
                  </Text>
                  <Text className="text-slate-600 text-sm">
                    {attr.applicability}
                  </Text>
                </View>
              )}
            </View>

            {/* CLAIMS */}
            {/* <View className="mt-6">
              <Text className="text-slate-700 font-bold mb-3">Claims</Text>

              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : claims.length > 0 ? (
                claims.map((c: any, i: number) => (
                  <View
                    key={i}
                    className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm"
                  >
                    <Text className="text-slate-600 text-sm">
                      {c.attributes?.description}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-slate-400 italic text-sm">
                  No claims available.
                </Text>
              )}
            </View> */}

            {/* DOCUMENTS */}
            {/* <View className="mt-6">
              <Text className="text-slate-700 font-bold mb-3">Documents</Text>

              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : documents.length > 0 ? (
                documents.map((doc: any, i: number) => (
                  <View
                    key={i}
                    className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm"
                  >
                    <Text className="text-slate-600 text-sm">
                      📄 File #{i + 1}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-slate-400 italic text-sm">
                  No documents uploaded.
                </Text>
              )}
            </View> */}

            {/* PAYMENT SCHEDULE */}
            {/* {isPayment && (
              <View className="mt-6">
                <Text className="text-slate-700 font-bold mb-3">
                  Payment Schedule
                </Text>

                {loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : schedules.length > 0 ? (
                  schedules.map((s: any, i: number) => (
                    <View
                      key={i}
                      className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm"
                    >
                      <Text className="text-slate-700 font-bold text-sm">
                        Installment #{s.attributes.installment_no}
                      </Text>
                      <Text className="text-slate-500 text-xs mt-1">
                        ₱{s.attributes.amount}
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        Due: {s.attributes.due_date}
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        Status: {s.attributes.status}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-slate-400 italic text-sm">
                    No schedules yet.
                  </Text>
                )}
              </View>
            )} */}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="w-full p-5 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={handleBack}
          disabled={navigating}
          className={`h-16 rounded-2xl justify-center items-center ${
            navigating ? "bg-slate-400" : "bg-primary"
          }`}
        >
          {navigating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Back</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
