import api from "./api";

export interface OrderItem {
  product_name: string;
  product_image: string | null;
  variant_name: string | null;
  price: number;
  quantity: number;
}

export interface OrderTracking {
  created_at: string | null;
  confirmed_at: string | null;
  processing_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  returned_at: string | null;
}

export interface OrderListItem {
  id: number;
  order_number: string;
  store_name: string;
  status:
    | "to-pay"
    | "to-ship"
    | "to-receive"
    | "completed"
    | "delivered"
    | "cancelled"
    | "return_requested"
    | "return_approved"
    | "returned";
  raw_status: string;
  status_label: string;
  shipping_fee: number;
  total: number;
  items: OrderItem[];
  tracking: OrderTracking;
  created_at: string;
}

export interface SingleOrderResponse {
  success: boolean;
  data: {
    order: {
      id: number;
      order_number: string;
      status: string;
      shipping_fee: number;
      total: number;
      created_at: string;
      store: { id: number; name: string };
      items: OrderItem[];
      shipping_name: string;
      shipping_phone: string;
      shipping_address: string;
      paid_at: string | null;
      shipped_at: string | null;
      completed_at: string | null;
    };
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

export interface OrderBadges {
  to_pay: number;
  to_ship: number;
  to_receive: number;
  to_rate: number;
}

export interface OrderIndexResponse {
  success: boolean;
  data: {
    user: {
      name: string;
      phone: string | null;
      avatar: string | null;
    };
    orders: OrderListItem[];
    pagination: PaginationMeta;
    filters: {
      status: string;
    };
    badges: OrderBadges;
  };
}

export const fetchOrdersAPI = async (
  status: string,
  page: number = 1,
): Promise<OrderIndexResponse> => {
  const response = await api.get<OrderIndexResponse>("/store/orders", {
    params: {
      status,
      page,
    },
  });

  return response.data;
};

export const fetchSingleOrderAPI = async (
  orderId: number | string,
): Promise<SingleOrderResponse> => {
  const response = await api.get<SingleOrderResponse>(
    `/store/orders/${orderId}`,
  );
  return response.data;
};

export const fetchOrderBadgesAPI = async (): Promise<OrderBadges> => {
  const response = await api.get<OrderIndexResponse>("/store/orders", {
    params: {
      status: "all",
      page: 1,
    },
  });

  return response.data.data.badges;
};

export const updateOrderStatusAPI = async (
  orderId: number,
  status:
    | "cancelled"
    | "delivered"
    | "completed"
    | "return_requested"
    | "return_approved"
    | "returned",
) => {
  const response = await api.post(`/store/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};
