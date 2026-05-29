import { Skeleton } from "@/components/ui/skeleton";
import { getNews, NewsItem } from "@/services/newsService";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();

  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NewsItem[]>([]);
  const [recommendations, setRecommendations] = useState<NewsItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [isSearching, setIsSearching] = useState(false);

  // ================= LIVE SEARCH =================
  useEffect(() => {
    if (query.trim().length < 2) {
      setRecommendations([]);
      setLoadingSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);

      try {
        const data = await getNews({
          page: 1,
          limit: 8,
          search: query,
        });

        // ================= FIX EMPTY ITEMS =================
        const filteredData = data.filter(
          (item: NewsItem) => item?.PostTitle && item.PostTitle.trim() !== "",
        );

        setRecommendations(filteredData);
      } catch (err) {
        console.log("Suggestions Error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 250);

    return () => clearTimeout(debounce);
  }, [query]);

  // ================= EXECUTE SEARCH =================
  const executeSearch = async (searchWord = query) => {
    if (!searchWord.trim()) return;

    Keyboard.dismiss();

    setIsSearching(false);
    setLoading(true);

    try {
      const data = await getNews({
        page: 1,
        limit: 30,
        search: searchWord,
      });

      setResults(data);
    } catch (err) {
      console.log("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= SELECT =================
  const handleSelectRecommendation = (item: NewsItem) => {
    Keyboard.dismiss();

    setQuery(item.PostTitle);
    setIsSearching(false);

    router.push({
      pathname: "/news/details",
      params: { id: item.id.toString() },
    });
  };

  // ================= CLEAR =================
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setRecommendations([]);
    setIsSearching(false);

    inputRef.current?.focus();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString.replace(" ", "T"));

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {/* ================= HEADER ================= */}
          <View className="px-4 bg-white">
            <View className="flex-row items-center h-14 px-4 rounded-2xl bg-slate-100 border border-slate-200">
              <TextInput
                ref={inputRef}
                autoFocus
                value={query}
                onFocus={() => {
                  if (query.length >= 2) {
                    setIsSearching(true);
                  }
                }}
                onChangeText={(text) => {
                  setQuery(text);
                  setIsSearching(true);
                }}
                placeholder="Search latest news..."
                placeholderTextColor="#94a3b8"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                selectionColor="#034194"
                onSubmitEditing={() => executeSearch()}
                className="flex-1 text-[15px] text-slate-800"
              />

              {query.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={clearSearch}
                  className="ml-2 w-6 h-6 rounded-full bg-slate-300 items-center justify-center"
                >
                  <Text className="text-white text-[11px] font-bold">✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ================= CONTENT ================= */}
          <View className="flex-1 bg-white">
            {/* ================= RECOMMENDATIONS ================= */}
            {isSearching && query.length >= 2 && (
              <View className="px-4 pb-5">
                <View className="bg-white rounded-3xl overflow-hidden">
                  {loadingSuggestions ? (
                    <View>
                      <View className="px-4 py-3 border-b border-slate-100">
                        <Skeleton className="h-3 w-24 rounded-full" />
                      </View>

                      {[1, 2, 3, 4, 5].map((item) => (
                        <View
                          key={item}
                          className="px-4 py-4 border-b border-slate-100"
                        >
                          <Skeleton className="h-4 w-full rounded-full" />

                          <Skeleton className="h-3 w-20 rounded-full mt-3" />
                        </View>
                      ))}
                    </View>
                  ) : recommendations.length > 0 ? (
                    <>
                      <View className="px-4 py-3 border-b border-slate-100">
                        <Text className="text-[11px] font-bold tracking-widest text-slate-400">
                          SUGGESTIONS
                        </Text>
                      </View>

                      <FlatList
                        data={recommendations}
                        keyExtractor={(item, index) =>
                          `rec-${item.id}-${index}`
                        }
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                        onScrollBeginDrag={() => Keyboard.dismiss()}
                        removeClippedSubviews={true}
                        initialNumToRender={8}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        renderItem={({ item, index }) => (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleSelectRecommendation(item)}
                            className={`px-4 py-4 ${
                              index !== recommendations.length - 1
                                ? "border-b border-slate-100"
                                : ""
                            }`}
                          >
                            <View className="flex-1 pr-2">
                              <Text
                                numberOfLines={2}
                                className="text-sm font-semibold text-slate-800 leading-5"
                              >
                                {item.PostTitle}
                              </Text>

                              <Text className="text-[11px] text-slate-400 mt-1">
                                {item.CategoryName}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    </>
                  ) : (
                    <View className="py-10 items-center">
                      <Text className="text-slate-400 text-sm">
                        No suggestions found
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ================= RESULTS ================= */}
            {!isSearching && (
              <>
                {loading ? (
                  <View className="px-4 pt-4">
                    {[1, 2, 3, 4].map((item) => (
                      <View
                        key={item}
                        className="mb-4 bg-white border border-slate-100 rounded-2xl overflow-hidden flex-row h-32"
                      >
                        <Skeleton className="w-32 h-full" />

                        <View className="flex-1 p-4 justify-between">
                          <View>
                            <Skeleton className="h-4 w-full rounded-full mb-3" />
                            <Skeleton className="h-4 w-11/12 rounded-full mb-3" />
                            <Skeleton className="h-4 w-9/12 rounded-full" />
                          </View>

                          <Skeleton className="h-3 w-32 rounded-full" />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={(item, index) => `result-${item.id}-${index}`}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={() => Keyboard.dismiss()}
                    contentContainerStyle={{
                      paddingTop: 12,
                      paddingBottom: 40,
                    }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                          router.push({
                            pathname: "/news/details",
                            params: { id: item.id.toString() },
                          })
                        }
                        className="mx-4 mb-4 bg-white border border-slate-100 rounded-2xl overflow-hidden flex-row h-32"
                      >
                        <View className="relative">
                          <Image
                            source={{
                              uri: `https://newsphilippinesonline.com/editortextadminpanel/postimages/${item.PostImage}`,
                            }}
                            className="w-32 h-full bg-slate-100"
                            resizeMode="cover"
                          />

                          <View className="bg-white px-3 py-1 absolute top-1.5 left-1.5 rounded-full">
                            <Text className="text-[10px] font-bold text-primary">
                              {item.CategoryName}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-1 p-4 justify-between">
                          <Text
                            numberOfLines={3}
                            className="text-[15px] font-bold text-slate-800 leading-6"
                          >
                            {item.PostTitle}
                          </Text>

                          <Text className="text-[11px] text-slate-400">
                            Posted on {formatDate(item.PostingDate)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
