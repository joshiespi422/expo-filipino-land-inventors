import { Skeleton } from "@/components/ui/skeleton";
import { AdItem } from "@/services/adService";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface BannerSliderProps {
  ads: AdItem[];
  loading: boolean;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ ads, loading }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Get real-time screen width
  const { width: windowWidth } = useWindowDimensions();

  // 2. Cap maximum width (380px for phones, max 450px for tablets)
  const bannerWidth = Math.min(windowWidth - 48, 450);

  // 3. Set fixed aspect ratio height (2:1 ratio -> height is half the width)
  const bannerHeight = bannerWidth / 2;

  // Auto-slide effect
  useEffect(() => {
    if (loading || ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ads.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [ads, loading, bannerWidth]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    if (bannerWidth > 0) {
      const index = Math.round(contentOffsetX / bannerWidth);
      setCurrentIndex(index);
    }
  };

  const handleAdPress = (ad: AdItem) => {
    if (ad.link) {
      setSelectedAd(ad);
      setModalVisible(true);
    }
  };

  const handleConfirmLink = async () => {
    if (selectedAd?.link) {
      setModalVisible(false);
      const canOpen = await Linking.canOpenURL(selectedAd.link);
      if (canOpen) {
        await Linking.openURL(selectedAd.link);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centerWrapper}>
        <Skeleton
          className="my-2"
          style={{ width: bannerWidth, height: 140, borderRadius: 16 }}
        />
      </View>
    );
  }

  if (!ads || ads.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Outer Centered Frame */}
      <View style={styles.centerWrapper}>
        <View
          style={[
            styles.bannerContainer,
            { width: bannerWidth, height: bannerHeight },
          ]}
        >
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={bannerWidth}
          >
            {ads.map((ad) => (
              <TouchableOpacity
                key={ad.id}
                activeOpacity={0.9}
                onPress={() => handleAdPress(ad)}
                style={{ width: bannerWidth, height: bannerHeight }}
              >
                <Image
                  source={{ uri: ad.image }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Slide Indicators */}
      {ads.length > 1 && (
        <View className="flex-row justify-center items-center gap-1.5">
          {ads.map((_, index) => (
            <View
              key={index}
              style={{
                backgroundColor: currentIndex === index ? "#034194" : "#cbd5e1",
                width: currentIndex === index ? 16 : 6,
              }}
              className="h-1.5 rounded-full transition-all"
            />
          ))}
        </View>
      )}

      {/* External Link Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          className="flex-1 justify-center items-center px-6"
        >
          <View className="bg-white p-6 rounded-3xl w-full max-w-[360px] items-center shadow-xl">
            <Text className="text-xl font-bold text-slate-800 text-center mb-2">
              Visit External Link?
            </Text>
            <Text className="text-slate-500 text-center mb-6 leading-5">
              You are about to leave the app and open:{"\n"}
              <Text className="font-semibold text-slate-700">
                {selectedAd?.link}
              </Text>
            </Text>

            <View className="w-full gap-y-3">
              <TouchableOpacity
                onPress={handleConfirmLink}
                className="w-full py-3.5 rounded-xl bg-primary active:opacity-90"
              >
                <Text className="text-white text-center font-bold text-base">
                  Continue to Website
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-full py-3.5 rounded-xl bg-gray-100 active:opacity-90"
              >
                <Text className="text-slate-600 text-center font-bold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
  },
  centerWrapper: {
    width: "100%",
    alignItems: "center",
  },
  bannerContainer: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
});
