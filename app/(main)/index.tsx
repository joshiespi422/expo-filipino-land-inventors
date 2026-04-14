import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import "../../global.css";

// Assets
import Ask from "../../assets/images/icon/Ask.png";
import Businessicon from "../../assets/images/icon/Businessicon.png";
import Coop from "../../assets/images/icon/coop.png";
import FISMPC from "../../assets/images/icon/FISMPC.png";
import Funding from "../../assets/images/icon/Funding.png";
import Intellectual from "../../assets/images/icon/Intellectual.png";
import Licensing from "../../assets/images/icon/Licensing.png";
import Loan from "../../assets/images/icon/Loan.png";
import Lost from "../../assets/images/icon/Lost.png";
import News from "../../assets/images/icon/News.png";
import Product from "../../assets/images/icon/Product.png";
import RD from "../../assets/images/icon/RD.png";
import Suggest from "../../assets/images/icon/Suggest.png";
import image from "../../assets/images/image.png";

export default function DashboardPage() {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    {
      label: "Business Training",
      href: "/(business)/",
      source: Businessicon,
    },
    {
      label: "Intellectual Property Assistant",
      href: "/(intellectual)/",
      source: Intellectual,
    },
    {
      label: "Funding & Invest Opportunities",
      href: "/(auth)/login",
      source: Funding,
    },
    {
      label: "Licensing & Permit Assistance",
      href: "/(business)/",
      source: Licensing,
    },
    { label: "R & D Collaboration", href: "/", source: RD },
    { label: "Ask an Expert Assistance", href: "/", source: Ask },
    { label: "Loan Assistance", href: "../(loan)/", source: Loan },
    { label: "FISMPC Online Store", href: "/", source: FISMPC },
    { label: "Product Validation Services", href: "/", source: Product },
    { label: "Lost & Found", href: "/", source: Lost },
    { label: "Suggest a Service", href: "/", source: Suggest },
    { label: "Coop Membership", href: "/", source: Coop },
    { label: "News & Event", href: "/", source: News },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="flex-1"
    >
      <View className="flex-1 bg-white items-center">
        <View className="px-6 pt-2 w-full max-w-[500px] mx-auto">
          {/* 1. WELCOME TEXT SKELETON */}
          <View className="items-center">
            {pageLoading ? (
              <>
                <Skeleton className="h-10 w-50 rounded-md" />
              </>
            ) : (
              <>
                <Text className="text-2xl text-slate-800 text-center">
                  Hello, <Text className="font-bold">Juan Dela Cruz!</Text>
                </Text>
                <Text className="text-md text-slate-800 text-center">
                  How can we help you today?
                </Text>
              </>
            )}
          </View>

          {/* 2. BANNER IMAGE SKELETON */}
          <View className="mt-5">
            {pageLoading ? (
              <Skeleton className="!w-full !h-36 rounded-2xl" />
            ) : (
              <Image
                source={image}
                className="!w-full !h-36"
                resizeMode="contain"
              />
            )}
          </View>

          {/* 3. GRID MENU SKELETON */}
          <View className="flex-row flex-wrap max-w-[300px] justify-between mx-auto mt-8 mb-5">
            {pageLoading
              ? // Render 12 Skeleton Items to match the menu
                Array.from({ length: 12 }).map((_, i) => (
                  <View key={i} className="!w-[80px] mb-5">
                    <Skeleton className="!w-12 !h-12 mx-auto" />
                    <Skeleton className="text-center h-5 mt-2" />
                  </View>
                ))
              : // Render Actual Menu Items
                menuItems.map((item, index) => (
                  <Link key={index} href={item.href as any} className="mb-5">
                    <View className="!w-[80px]">
                      <Image
                        source={item.source}
                        className="!w-12 !h-12 mx-auto"
                      />
                      <Text className="text-center text-sm/4 pt-2">
                        {item.label}
                      </Text>
                    </View>
                  </Link>
                ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
