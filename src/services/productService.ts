import api from "./api";

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

export interface ProductImage {
  id: number;
  url: string;
  sort_order: number;
}

export interface AttributeValue {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: number;
  sku: string | null;
  price: string | number;
  compare_price: string | number | null;
  stock: number;
  is_default: boolean;
  image: string | null;
  attributes: AttributeValue[];
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_official: boolean;
}

export interface DetailedProduct {
  id: number;
  name: string;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;
  categories: Category[];
  images: ProductImage[];
  video: string | null;
  variants: ProductVariant[];
  store: Store;
}

export interface ProductShowResponse {
  status: string;
  product: DetailedProduct;
}

export const getStoreHome = async (
  categoryId?: string | number,
  page: number = 1,
): Promise<StoreHomeResponse> => {
  const params: { category_id?: string | number; page: number } = { page };

  if (categoryId && categoryId !== "All") {
    params.category_id = categoryId;
  }

  const response = await api.get("/store/home", { params });

  console.log(
    `STORE API RESPONSE (Page ${page}):`,
    JSON.stringify(response.data, null, 2),
  );
  return response.data;
};

/**
 * Fetch detailed single product using Route Model Binding with Slug.
 * Appends the missing '/store' prefix to perfectly match your backend routing groups.
 */
export const getProductShow = async (
  slug: string,
): Promise<ProductShowResponse> => {
  const response = await api.get(`/store/products/${slug}`);

  console.log(
    `PRODUCT DETAILS API RESPONSE (${slug}):`,
    JSON.stringify(response.data, null, 2),
  );
  return response.data;
};
