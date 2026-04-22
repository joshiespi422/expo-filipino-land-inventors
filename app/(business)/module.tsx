import { trainingService } from "@/services/trainingService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ModulePage() {
  const { categorySlug, module } = useLocalSearchParams();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null); // Added to reset scroll on next module

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categorySlug || !module) return;

    const fetchModule = async () => {
      setLoading(true);
      try {
        const res = await trainingService.getModule(
          categorySlug as string,
          parseInt(module as string),
        );
        setData(res);
        // Scroll to top when a new module loads
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } catch (err) {
        console.error("Error fetching module:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [module, categorySlug]);

  const formatText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/\\n/g, "\n") // Usually you want actual newlines, or use ' ' for a block
      .replace(/\s+/g, " ")
      .trim();
  };

  const contentArray = data?.data?.attributes?.content || [];
  const meta = data?.meta;
  // Fallback to 0 if meta isn't loaded yet to prevent NaN styles
  const progress = meta ? (meta.current_module / meta.total_modules) * 100 : 0;

  const handleNext = () => {
    if (meta?.is_last) {
      router.push("/congratulations");
    } else if (meta?.next_module) {
      router.setParams({
        module: meta.next_module.toString(),
      });
    }
  };

  const handleBack = () => {
    if (!meta?.is_first && meta?.prev_module) {
      router.setParams({
        module: meta.prev_module.toString(),
      });
    } else {
      router.back();
    }
  };

  // Improved Loading State (prevents flicker if data is already there)
  if (loading && !data) {
    return (
      <View className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header & Progress Bar */}
      <View className="bg-white p-6 shadow-sm">
        <View className="flex-row justify-between items-end mb-2">
          <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Module {meta?.current_module ?? 0} of {meta?.total_modules ?? 0}
          </Text>
          <Text className="text-primary font-bold text-xs">
            {Math.round(progress)}% Complete
          </Text>
        </View>
        <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {contentArray.length > 0 ? (
          contentArray.map((item: any, index: number) => (
            <View
              key={index}
              className="bg-white p-6 rounded-3xl mb-4 shadow-sm border border-slate-100"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
                  <Text className="text-primary font-bold">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-xl font-bold text-slate-800">
                  {item.title}
                </Text>
              </View>
              <Text className="text-lg text-slate-600 leading-7">
                {formatText(item.description)}
              </Text>
            </View>
          ))
        ) : (
          <View className="items-center mt-10">
            <Text className="text-slate-400 italic">
              No content available for this module.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <View className="p-5 bg-white border-t border-slate-200 flex-row gap-x-3">
        {/* Changed logic from 'step' to 'meta.is_first' */}
        {!meta?.is_first && (
          <TouchableOpacity
            onPress={handleBack}
            className="flex-1 h-16 rounded-2xl justify-center items-center border border-slate-200 bg-white"
          >
            <Text className="text-slate-600 font-bold text-lg">Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNext}
          disabled={loading}
          className={`flex-[2] h-16 rounded-2xl flex-row justify-center items-center shadow-md ${
            loading ? "bg-slate-400" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg mr-2">
                {meta?.is_last ? "Finish Training" : "Continue"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
