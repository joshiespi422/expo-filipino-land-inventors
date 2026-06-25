import api from "./api";

export interface Address {
  id: number;
  label: string;
  recipient_name: string;
  recipient_number: string;
  full_address: string;
  is_default: boolean;
  landmark?: string | null;
}

export interface PaymentMethod {
  id: number;
  slug: string;
  name: string;
}

export interface CheckoutItem {
  id: number;
  quantity: number;
  product: {
    name: string;
    slug: string;
    image: string | null;
    store: {
      name: string;
      slug: string;
    };
  };
  variant: {
    id: number;
    sku: string;
    price: number;
    image?: string | null;
  };
  attributes: { name: string; value: string }[];
  subtotal: number;
}

export interface CheckoutSummary {
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
}

export interface CheckoutDetailsResponse {
  success: boolean;
  data: {
    addresses: Address[];
    paymentMethods: PaymentMethod[];
    items: CheckoutItem[];
    summary: CheckoutSummary;
  };
}

export interface PlaceOrderPayload {
  address_id: number;
  payment_method_id: number;
  cart_item_ids: number[];
  note?: string;
}

export interface PlaceOrderResponse {
  success: boolean;
  message: string;
  checkout_id?: number;
}

/**
 * Fetches the checkout records from Laravel using standard URL parameter serialization
 */
export const fetchCheckoutDetails = async (
  cartItemIds: number[],
): Promise<CheckoutDetailsResponse> => {
  const response = await api.get<CheckoutDetailsResponse>("/store/checkout", {
    params: {
      cart_item_ids: cartItemIds,
    },
    // ✅ FIXED: Using direct assignment transformation arrays for standard key value configurations
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();
      if (params.cart_item_ids) {
        params.cart_item_ids.forEach((id: number) => {
          searchParams.append("cart_item_ids[]", id.toString());
        });
      }
      return searchParams.toString();
    },
  });

  return response.data;
};

/**
 * Dispatches the complete order structural data payload transaction to Laravel
 */
export const placeOrderAPI = async (
  payload: PlaceOrderPayload,
): Promise<PlaceOrderResponse> => {
  const response = await api.post<PlaceOrderResponse>(
    "/store/checkout",
    payload,
  );
  return response.data;
};
