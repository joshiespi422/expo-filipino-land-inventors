import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import logo from "../../assets/images/logo.png";
import s1 from "../../assets/images/vector/s1.png";
import s2 from "../../assets/images/vector/s2.png";
import s3 from "../../assets/images/vector/s3.png";
import s4 from "../../assets/images/vector/s4.png";
import "../../global.css";

const { width } = Dimensions.get("window");

const slides = [
  {
    normal: "Need",
    highlight: "Business",
    second: "Training?",
    image: s1,
  },
  {
    normal: "Need",
    highlight: "Intellectual",
    second: "Property Assistance?",
    image: s2,
  },
  {
    normal: "Need",
    highlight: "Funding &",
    second: "Investment Opportunities?",
    image: s3,
  },
  {
    normal: "Need",
    highlight: "Loan",
    second: "Assistance",
    second_normal: "and more?",
    image: s4,
  },
];

export default function CongratulationPage() {
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  const isProcessing = useRef(false);

  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [navigating, setNavigating] = useState(false);

  // Splash animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);

    setCurrentIndex(index);
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    }
  };

  const handleGetStarted = () => {
    if (isProcessing.current || navigating) return;

    isProcessing.current = true;
    setNavigating(true);

    setTimeout(() => {
      router.replace("../(main)/");
    }, 700);
  };

  // SPLASH SCREEN
  if (showSplash) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <Image
          source={logo}
          resizeMode="contain"
          style={{
            width: 180,
            height: 180,
          }}
        />

        {/* Smooth loading dots */}
        <View className="flex-row mt-8">
          <Animated.View
            style={{ opacity: dot1 }}
            className="w-3 h-3 rounded-full bg-white mx-1"
          />

          <Animated.View
            style={{ opacity: dot2 }}
            className="w-3 h-3 rounded-full bg-white mx-1"
          />

          <Animated.View
            style={{ opacity: dot3 }}
            className="w-3 h-3 rounded-full bg-white mx-1"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white py-10">
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {slides.map((item, index) => (
          <View
            key={index}
            style={{ width }}
            className="items-center justify-center px-7 flex-1"
          >
            <Image
              source={item.image}
              resizeMode="contain"
              style={{
                width: 300,
                height: 300,
              }}
            />

            <View className="mt-8 items-center">
              {/* FIRST LINE */}
              <Text className="text-[28px] font-bold text-center leading-[42px]">
                {item.normal}{" "}
                <Text className="text-primary">{item.highlight}</Text>
              </Text>

              {/* SECOND LINE */}
              <Text className="text-[28px] font-bold text-center leading-[42px]">
                <Text className="text-primary">{item.second}</Text>{" "}
                {item.second_normal}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View className="flex-row justify-center items-center mt-3 mb-7">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`mx-1 rounded-full ${
              index === currentIndex
                ? "bg-primary w-8 h-3"
                : "bg-slate-300 w-3 h-3"
            }`}
          />
        ))}
      </View>

      {/* Buttons */}
      <View className="px-5">
        {currentIndex !== slides.length - 1 ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={nextSlide}
            className="bg-primary h-16 rounded-2xl justify-center items-center"
            style={{
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-lg">Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleGetStarted}
            disabled={navigating}
            activeOpacity={0.85}
            className={`h-16 rounded-2xl justify-center items-center ${
              navigating ? "bg-slate-400" : "bg-primary"
            }`}
            style={{
              elevation: navigating ? 0 : 4,
            }}
          >
            {navigating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Get Started Now
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
