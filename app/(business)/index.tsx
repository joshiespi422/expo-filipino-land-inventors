import { Skeleton } from "@/components/ui/skeleton";
import { trainingService } from "@/services/trainingService";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function BusinessTypesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainingService
      .getTypes()
      .then((res) => setTypes(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-12">
          <Text className="text-2xl text-center font-extrabold text-primary tracking-tight">
            Choose Your Businesss Type
          </Text>
          <Text className="text-sm text-center text-slate-500 mt-1">
            Select the type of business you want to learn or start.
          </Text>
        </View>

        <View className="px-6">
          {loading ? (
            // Improved Skeleton layout
            [1, 2, 3].map((i) => (
              <View key={i} className="mb-4">
                <Skeleton className="h-24 w-full rounded-3xl" />
              </View>
            ))
          ) : Array.isArray(types) && types.length > 0 ? (
            types.map((type: any) => (
              <Link
                key={type.id}
                href={{
                  pathname: "/category",
                  params: {
                    typeSlug: type.attributes.slug,
                    typeName: type.attributes.name,
                  },
                }}
                asChild
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="bg-white p-5 rounded-3xl mb-4 flex-row items-center shadow-sm border border-slate-100"
                >
                  {/* Icon Placeholder - You can map these to specific slugs later */}
                  <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mr-4">
                    <Ionicons name="business" size={28} color="#007AFF" />
                  </View>

                  <View className="flex-1">
                    <Text className="text-xl text-slate-800 font-bold">
                      {type.attributes.name}
                    </Text>
                    <Text className="text-slate-400 text-sm">
                      View training modules
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              </Link>
            ))
          ) : (
            <View className="items-center py-20">
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text className="text-slate-400 mt-4 text-lg">
                No business types found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
