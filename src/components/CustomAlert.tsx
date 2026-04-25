import * as NavigationBar from "expo-navigation-bar";
import React, { useEffect } from "react";
import {
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
}: CustomAlertProps) => {
  // Re-hide the navigation bar specifically when the modal is active
  useEffect(() => {
    if (visible && Platform.OS === "android") {
      const reHide = async () => {
        await NavigationBar.setVisibilityAsync("hidden");
      };
      reHide();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {visible && (
        <StatusBar
          barStyle="light-content"
          backgroundColor="rgba(0,0,0,0.6)"
          translucent={true}
        />
      )}

      <View
        className="flex-1 justify-center items-center bg-black/60 px-8"
        style={{
          width: "100%",
          // Height 120% ensures the overlay covers the nav bar area even when it shifts
          height: Platform.OS === "android" ? "100%" : "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <View className="bg-white w-full max-w-[400px] rounded-[35px] p-5 shadow-2xl elevation-10">
          <Text className="text-primary text-2xl font-bold text-center mb-3">
            {title}
          </Text>

          <Text className="text-slate-500 text-base text-center mb-6 leading-6">
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="bg-primary p-4 rounded-2xl shadow-md shadow-primary/30"
          >
            <Text className="text-white text-center font-bold text-base">
              Okay
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
