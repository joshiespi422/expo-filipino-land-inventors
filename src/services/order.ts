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
