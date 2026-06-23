import api from "./api";

// Matches your database category fields
export interface Category {
  id: number | string;
  name: string;
  slug: string;
  parent_id?: number | null;
  image?: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  price: number | null;
  compare_price: number | null;
  stock: number;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  has_more: boolean;
}

export interface StoreHomeResponse {
  success: boolean;
  data: {
    categories: Category[];
    productsTopDeals: Product[];
    productsDiscover: Product[];
    pagination: Pagination;
  };
}

// Supports category filtering and pagination
export const getStoreHome = async (
  categoryId?: string | number,
  page: number = 1,
): Promise<StoreHomeResponse> => {
  const params: {
    category_id?: string | number;
    page: number;
  } = {
    page,
  };

  // Attach category filter when selected
  if (categoryId && categoryId !== "All") {
    params.category_id = categoryId;
  }

  const response = await api.get("/store/home", {
    params,
  });

  console.log(
    `STORE API RESPONSE (Page ${page}):`,
    JSON.stringify(response.data, null, 2),
  );

  return response.data;
};
