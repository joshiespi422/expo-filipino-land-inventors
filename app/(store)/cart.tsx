import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

const initialCart = [
  {
    id: "1",
    seller: "Fashion Store",
    name: "Premium T-Shirt Oversized Cotton Casual Wear",
    image:
      "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/180221s4.jpg?im=Resize,width=750",
    price: 399,
    originalPrice: 599,
    discount: "33% OFF",
    variant1: "Size: XL",
    variant2: "Color: Red",
    quantity: 1,
    selected: true,
  },
  {
    id: "2",
    seller: "Fashion Store",
    name: "Casual Cotton Hoodie",
    image:
      "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/740089s5.jpg?im=Resize,width=750",
    price: 599,
    originalPrice: 799,
    discount: "25% OFF",
    variant1: "Size: Large",
    variant2: "Color: Gray",
    quantity: 2,
    selected: true,
  },
  {
    id: "3",
    seller: "Tech Gadget Shop",
    name: "Wireless Bluetooth Earbuds",
    image:
      "https://www.belkin.com/dw/image/v2/BGBH_PRD/on/demandware.static/-/Sites-master-product-catalog-blk/default/dw6c001382/images/hi-res/7/7ecfadda6626ab6e_AUC013btSD_SoundForm_OpenEarTWSEarbuds_Hero_WEB.jpg?sw=700&sh=700&sm=fit&sfrm=png",
    price: 1299,
    originalPrice: 1299,
    discount: "",
    variant1: "",
    variant2: "",
    quantity: 1,
    selected: false,
  },
];

export default function CartPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState(initialCart);

  const groupedSellers = useMemo(() => {
    const groups: Record<string, typeof cartItems> = {};

    cartItems.forEach((item) => {
      if (!groups[item.seller]) {
        groups[item.seller] = [];
      }

      groups[item.seller].push(item);
    });

    return Object.entries(groups);
  }, [cartItems]);

  const updateQuantity = (id: string, type: "add" | "minus") => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                type === "add"
                  ? item.quantity + 1
                  : Math.max(1, item.quantity - 1),
            }
          : item,
      ),
    );
  };

  const toggleProduct = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              selected: !item.selected,
            }
          : item,
      ),
    );
  };

  const toggleSeller = (seller: string) => {
    const products = cartItems.filter((item) => item.seller === seller);

    const selected = products.every((item) => item.selected);

    setCartItems((prev) =>
      prev.map((item) =>
        item.seller === seller
          ? {
              ...item,
              selected: !selected,
            }
          : item,
      ),
    );
  };

  const toggleAll = () => {
    const selected = cartItems.every((item) => item.selected);

    setCartItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: !selected,
      })),
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cartItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedCount = cartItems.filter((item) => item.selected).length;

  const goCheckout = () => {
    if (selectedCount === 0) {
      return;
    }

    router.push("/checkout");
  };

  return (
    <View className="flex-1 bg-slate-100">
      <FlatList
        data={groupedSellers}
        keyExtractor={(item) => item[0]}
        contentContainerStyle={{
          padding: 12,
          paddingBottom: 140,
        }}
        renderItem={({ item }) => {
          const seller = item[0];
          const products = item[1];

          const sellerSelected = products.every((product) => product.selected);

          return (
            <View className="bg-white rounded-2xl mb-4 overflow-hidden">
              {/* SHOP HEADER */}

              <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
                <TouchableOpacity onPress={() => toggleSeller(seller)}>
                  <Ionicons
                    name={sellerSelected ? "checkbox" : "square-outline"}
                    size={24}
                    color="#034194"
                  />
                </TouchableOpacity>

                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color="#034194"
                  style={{
                    marginLeft: 10,
                  }}
                />

                <Text className="ml-2 font-semibold text-slate-800">
                  {seller}
                </Text>
              </View>

              {products.map((product) => (
                <View
                  key={product.id}
                  className="flex-row p-3 border-b border-slate-100"
                >
                  <TouchableOpacity
                    onPress={() => toggleProduct(product.id)}
                    className="justify-center mr-3"
                  >
                    <Ionicons
                      name={product.selected ? "checkbox" : "square-outline"}
                      size={24}
                      color="#034194"
                    />
                  </TouchableOpacity>

                  <Image
                    source={{
                      uri: product.image,
                    }}
                    style={{
                      width: 85,

                      height: 85,

                      borderRadius: 12,
                    }}
                  />

                  <View className="flex-1 ml-3">
                    <Text
                      numberOfLines={2}
                      className="font-medium text-slate-800"
                    >
                      {product.name}
                    </Text>

                    {(product.variant1 || product.variant2) && (
                      <Text className="text-xs text-slate-500 mt-1">
                        {[product.variant1, product.variant2]
                          .filter(Boolean)
                          .join(" • ")}
                      </Text>
                    )}

                    <View className="flex-row items-center mt-2">
                      {product.originalPrice > product.price && (
                        <Text className="text-xs text-slate-400 line-through mr-2">
                          ₱{product.originalPrice}
                        </Text>
                      )}

                      <Text className="text-primary font-bold text-lg">
                        ₱{product.price}
                      </Text>

                      {product.discount && (
                        <Text className="ml-2 text-red-500 text-xs">
                          {product.discount}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row justify-between mt-3">
                      <TouchableOpacity onPress={() => removeItem(product.id)}>
                        <Ionicons name="trash-outline" size={20} color="red" />
                      </TouchableOpacity>

                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() => updateQuantity(product.id, "minus")}
                          className="w-8 h-8 border rounded-lg items-center justify-center"
                        >
                          <Text>-</Text>
                        </TouchableOpacity>

                        <Text className="mx-4">{product.quantity}</Text>

                        <TouchableOpacity
                          onPress={() => updateQuantity(product.id, "add")}
                          className="w-8 h-8 border rounded-lg items-center justify-center"
                        >
                          <Text>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        }}
      />

      {/* FOOTER */}

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={toggleAll}
            className="flex-row items-center"
          >
            <Ionicons
              name={
                cartItems.every((i) => i.selected)
                  ? "checkbox"
                  : "square-outline"
              }
              size={24}
              color="#034194"
            />

            <Text className="ml-2">Select All</Text>
          </TouchableOpacity>

          <View>
            <Text className="text-xs text-slate-500">
              {selectedCount} item(s)
            </Text>

            <Text className="text-primary font-bold text-xl">
              ₱{total.toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={goCheckout}
          className="bg-primary rounded-2xl mt-3 py-4 items-center"
        >
          <Text className="text-white font-semibold">
            Checkout ({selectedCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
