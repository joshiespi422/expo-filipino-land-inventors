import api from "./api";

export interface WalletResponse {
  data: {
    id: number;
    balance: string;
    show: boolean;
    updated_at: string;
  };
}

export interface WalletTransaction {
  id: number;
  amount: string;
  type: string;
  description: string;
  reference_id: number | null;
  reference_type: string | null;
  created_at: string;
}

export const getWalletBalance = async (): Promise<WalletResponse> => {
  const res = await api.get("/wallet");
  return res.data;
};

export const updateWalletVisibility = async (): Promise<WalletResponse> => {
  const res = await api.get("/wallet/update");
  return res.data;
};

// ✅ NEW
export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  const res = await api.get("/wallet/transaction");

  // Laravel Resource Collection
  return res.data.data;
};
