import api from "./api";

export interface OrderItem {
  product_name: string;
  product_image: string | null;
  variant_name: string | null;
  price: number;
  quantity: number;
}

export interface OrderListItem {
  id: number;
  store_name: string;
  status:
    | "to-pay"
    | "to-ship"
    | "to-receive"
    | "completed"
    | "cancelled"
    | "returned";
  status_label: string;
  shipping_fee: number;
  total: number;
  items: OrderItem[];
  created_at: string;
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

/**
 * Fetches order list records from Laravel with dynamic filter categories and page cursors
 */
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

/**
 * Fetches order badge counts for the buyer profile.
 * Uses the same endpoint to avoid creating another API.
 */
export const fetchOrderBadgesAPI = async (): Promise<OrderBadges> => {
  const response = await api.get<OrderIndexResponse>("/store/orders", {
    params: {
      status: "all",
      page: 1,
    },
  });

  return response.data.data.badges;
};
