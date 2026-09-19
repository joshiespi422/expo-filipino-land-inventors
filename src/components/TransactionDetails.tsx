import { WalletTransaction } from "@/services/walletService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------- Shared helpers (also used by history.tsx) ---------- */

export const formatMoney = (value: number): string =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Total = transfer amount + fee (fee is 0 for deposits and other rows)
export const getTotal = (item: WalletTransaction): number =>
  Number(item.amount || 0) + Number(item.transfer_fee || 0);

// A row is a transfer when it carries destination details
export const isTransferRow = (item: WalletTransaction): boolean =>
  !!item.to_account_name;

export const getTitle = (item: WalletTransaction): string => {
  if (isTransferRow(item)) {
    return item.type === "credit"
      ? "Transfer Refund"
      : `Transfer to ${item.to_account_name}`;
  }
  return item.description || "Wallet Transaction";
};

export const getSubtitle = (item: WalletTransaction): string | null => {
  if (!isTransferRow(item)) return null;

  return [item.to_provider, item.to_account_number].filter(Boolean).join(" • ");
};

// `type` decides direction: color, sign, icon and label
export const getStyle = (type: string) => {
  switch (type?.toLowerCase()) {
    case "deposit":
    case "credit":
      return {
        label: "Money In",
        color: "#16a34a",
        bg: "#dcfce7",
        icon: "arrow-down",
        sign: "+",
      };

    case "withdrawal":
    case "debit":
      return {
        label: "Money Out",
        color: "#dc2626",
        bg: "#fee2e2",
        icon: "arrow-up",
        sign: "-",
      };

    default:
      return {
        label: "Transaction",
        color: "#475569",
        bg: "#e2e8f0",
        icon: "swap-horizontal",
        sign: "",
      };
  }
};

/* ---------- UI ---------- */

const DetailRow = ({
  label,
  value,
  last,
  bold,
}: {
  label: string;
  value: string;
  last?: boolean;
  bold?: boolean;
}) => (
  <View
    className={`flex-row justify-between py-3 ${
      last ? "" : "border-b border-slate-200"
    }`}
  >
    <Text className="text-slate-400">{label}</Text>
    <Text
      className={`text-slate-700 max-w-[60%] text-right ${
        bold ? "font-bold" : "font-medium"
      }`}
    >
      {value}
    </Text>
  </View>
);

type Props = {
  transaction: WalletTransaction | null;
  onClose: () => void;
};

const CLOSE_DISTANCE = 120; // drag further than this to close
const CLOSE_VELOCITY = 0.8; // or flick faster than this

export default function TransactionDetails({ transaction, onClose }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(height)).current;
  const scrollY = useRef(0);

  // Keep the last transaction so the content stays visible while closing
  const [tx, setTx] = useState<WalletTransaction | null>(null);
  const [mounted, setMounted] = useState(false);

  // Latest values for the PanResponder (it is created only once)
  const onCloseRef = useRef(onClose);
  const heightRef = useRef(height);
  onCloseRef.current = onClose;
  heightRef.current = height;

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: heightRef.current,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        onCloseRef.current();
      }
    });
  };

  const snapBack = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  // Open animation
  useEffect(() => {
    if (transaction) {
      setTx(transaction);
      setMounted(true);
      scrollY.current = 0;
      translateY.setValue(heightRef.current);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [transaction]);

  // Drag down to close. Only takes over when the content is at the top,
  // so scrolling inside the sheet still works.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) && scrollY.current <= 0,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          dismiss();
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: snapBack,
    }),
  ).current;

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, height],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  if (!mounted || !tx) return null;

  const style = getStyle(tx.type);
  const isTransfer = isTransferRow(tx);
  const fee = Number(tx.transfer_fee || 0);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}
    >
      <View className="flex-1 justify-end bg-black/30">
        {/* BACKDROP (tap to close) */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            opacity: backdropOpacity,
          }}
        >
          <Pressable className="flex-1" onPress={dismiss} />
        </Animated.View>

        {/* SHEET CONTAINER */}
        <Animated.View
          {...panResponder.panHandlers}
          className="bg-white rounded-t-[32px] px-5 pt-3"
          style={{
            transform: [{ translateY }],
            maxHeight: "90%",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -6,
            },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 20,
            paddingBottom: Math.max(insets.bottom, 10) + 10,
          }}
        >
          {/* HANDLE */}
          <View className="items-center mb-5">
            <View className="w-12 h-1.5 rounded-full bg-slate-300" />
          </View>

          {/* TITLE */}
          <Text className="text-[22px] font-bold text-slate-900 mb-4 text-center">
            Transaction Details
          </Text>

          {/* SCROLLABLE CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <View className="items-center mb-6">
              <View
                style={{ backgroundColor: style.bg }}
                className="w-20 h-20 rounded-full items-center justify-center"
              >
                <Ionicons
                  name={style.icon as any}
                  size={38}
                  color={style.color}
                />
              </View>

              <Text
                style={{ color: style.color }}
                className="text-3xl font-bold mt-4"
              >
                {style.sign}
                {formatMoney(getTotal(tx))}
              </Text>

              <Text className="text-slate-500 mt-1">{style.label}</Text>
            </View>

            <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {/* Always shown */}
              <DetailRow label="From" value={tx.from_name || "—"} />
              <DetailRow label="To" value={tx.to_account_name || "—"} />
              <DetailRow
                label="Account Number"
                value={tx.to_account_number || "—"}
              />
              <DetailRow label="Provider" value={tx.to_provider || "—"} />

              {isTransfer ? (
                <>
                  <DetailRow
                    label="Transfer Amount"
                    value={formatMoney(Number(tx.amount || 0))}
                  />
                  <DetailRow
                    label="Transfer Fee"
                    value={fee === 0 ? "Free" : formatMoney(fee)}
                  />
                  <DetailRow
                    label="Total"
                    value={formatMoney(getTotal(tx))}
                    bold
                  />
                </>
              ) : null}

              {tx.description ? (
                <DetailRow label="Note" value={tx.description} />
              ) : null}

              <DetailRow
                label="Reference No."
                value={
                  tx.reference_number ||
                  (tx.reference_id ? String(tx.reference_id) : "N/A")
                }
              />
              <DetailRow label="Date" value={formatDate(tx.created_at)} last />
            </View>
          </ScrollView>

          {/* ACTION BUTTON */}
          <View className="pt-3 bg-white shadow-black">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={dismiss}
              className="bg-[#034194] rounded-2xl h-14 justify-center items-center"
            >
              <Text className="text-white text-center font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
