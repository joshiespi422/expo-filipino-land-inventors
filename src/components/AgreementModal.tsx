import { Check } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AgreementModalProps {
  visible: boolean;
  title: string;
  description: string;
  onAccept: () => void;
  onCancel: () => void;
}

export function AgreementModal({
  visible,
  title,
  description,
  onAccept,
  onCancel,
}: AgreementModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Reset states whenever the modal opens
  useEffect(() => {
    if (visible) {
      setHasScrolledToBottom(false);
      setContainerHeight(0);
      setContentHeight(0);
    }
  }, [visible]);

  // Unified dynamic height verification strategy to instantly catch short text / large displays
  useEffect(() => {
    if (containerHeight > 0 && contentHeight > 0) {
      if (contentHeight <= containerHeight + 5) {
        setHasScrolledToBottom(true);
      }
    }
  }, [containerHeight, contentHeight]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;

    // Check if the user reached close to the bottom (15px padding tolerance offset)
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 15;

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      {/* BACKDROP */}
      <Pressable onPress={onCancel} className="flex-1 bg-black/40 justify-end">
        {/* MODAL CARD */}
        <Pressable className="bg-white rounded-t-3xl p-5 max-h-[80%]">
          <Text className="text-xl font-bold text-slate-800 mb-4">{title}</Text>

          {/* SCROLL CONTAINER WRAPPER */}
          <View
            className="bg-slate-50 rounded-2xl mb-4 max-h-[60%] overflow-hidden"
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
          >
            <ScrollView
              className="p-4"
              onScroll={handleScroll}
              onContentSizeChange={(w, h) => setContentHeight(h)}
              scrollEventThrottle={16}
            >
              <Text className="text-slate-600 text-sm leading-relaxed mb-6">
                {description}
              </Text>
            </ScrollView>
          </View>

          {/* DYNAMIC SCROLL NOTICE WARNING */}
          {!hasScrolledToBottom && (
            <Text className="text-xs text-amber-600 font-medium text-center mb-4 animate-pulse">
              Please scroll down to the bottom of the document to accept.
            </Text>
          )}

          {/* ACTION BUTTONS */}
          <View className="flex-row gap-x-3 border mb-0">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 h-14 border border-slate-200 rounded-2xl justify-center items-center"
            >
              <Text className="text-slate-600 font-bold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!hasScrolledToBottom}
              onPress={onAccept}
              className={`flex-1 h-14 rounded-2xl justify-center items-center flex-row ${
                hasScrolledToBottom ? "bg-primary" : "bg-slate-300"
              }`}
            >
              <Check size={18} color="white" />
              <Text className="text-white font-bold ml-2">Accept</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
