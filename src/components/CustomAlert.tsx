import * as NavigationBar from "expo-navigation-bar";
import React, { useEffect } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

export const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Logout",
}: CustomAlertProps) => {
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
      {/* OVERLAY */}
      <View style={styles.modalOverlay} className="p-6">
        {/* MODAL BOX */}
        <View className="bg-white w-full max-w-[400px] rounded-[35px] p-6 shadow-2xl elevation-10">
          <Text className="text-primary text-2xl font-bold text-center mb-3">
            {title}
          </Text>

          <Text className="text-slate-500 text-base text-center mb-6 leading-6">
            {message}
          </Text>

          {onConfirm ? (
            <View className="flex-row gap-x-3">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-gray-100 p-4 rounded-2xl"
              >
                <Text className="text-gray-600 text-center font-bold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onConfirm}
                className="flex-1 p-4 bg-primary rounded-2xl"
              >
                <Text className="text-white text-center font-bold text-base">
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="bg-primary p-4 rounded-2xl"
            >
              <Text className="text-white text-center font-bold text-base">
                Okay
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});
