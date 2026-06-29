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
  rating: number | null;
  sold_count: number | null;
  image: string | null;
  price: number | null;
  compare_price: number | null;
  stock: number;
  is_liked: boolean;
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
  rating: number | null;
  categories: Category[];
  images: ProductImage[];
  video: string | null;
  variants: ProductVariant[];
  store: Store;
  is_liked?: boolean;
}

export interface ProductShowResponse {
  status: string;
  product: DetailedProduct;
}

export interface ToggleCollectionResponse {
  status: string;
  message: string;
  is_active: boolean;
}

export interface CollectionProduct {
  id: number;
  user_id: number;
  product_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product: Product;
}

export interface CollectionResponse {
  status: string;
  collections: CollectionProduct[];
}

/**
 * STORE HOME
 */
export const getStoreHome = async (
  categoryId?: string | number,
  page: number = 1,
): Promise<StoreHomeResponse> => {
  const params: { category_id?: string | number; page: number } = { page };

  if (categoryId && categoryId !== "All") {
    params.category_id = categoryId;
  }

  const response = await api.get("/store/home", { params });
  return response.data;
};

/**
 * PRODUCT DETAILS
 */
export const getProductShow = async (
  slug: string,
): Promise<ProductShowResponse> => {
  const response = await api.get(`/store/products/${slug}`);
  return response.data;
};

/**
 * TOP DEAL
 */
export interface TopDealsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}

/**
 * MY COLLECTIONS
 */
export const getCollections = async (): Promise<CollectionResponse> => {
  const response = await api.get("/store/collections");
  return response.data;
};

/**
 * TOGGLE COLLECTION
 * Expects the product slug string to match Laravel Route Model Binding rules
 */
export const toggleCollection = async (
  slug: string,
): Promise<ToggleCollectionResponse> => {
  const response = await api.post(`/store/collections/${slug}/toggle`);

  console.log(
    `TOGGLE COLLECTION (${slug}):`,
    JSON.stringify(response.data, null, 2),
  );

  return response.data;
};

export const getTopDeals = async (
  page: number = 1,
): Promise<TopDealsResponse> => {
  const response = await api.get("/store/top-deals", {
    params: {
      page,
    },
  });

  return response.data;
};
