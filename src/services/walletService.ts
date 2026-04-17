import api from "./api";

export interface WalletResponse {
  data: {
    id: number;
    balance: string;
    show: boolean;
    updated_at: string;
  };
}

export const getWalletBalance = async (): Promise<WalletResponse> => {
  const res = await api.get("/wallet");
  return res.data;
};

export const updateWalletVisibility = async (): Promise<WalletResponse> => {
  const res = await api.get("/wallet/update");
  return res.data;
};
