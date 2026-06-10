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

export interface WalletPreset {
  amount: number;
  amount_display: string;
}

export interface RechargePayload {
  amount: number;
  payment_method_id: number;
  gateway_payment_method_id?: string | null;
}

export interface RechargeResponse {
  success: boolean;
  message: string;
  data: WalletResponse["data"];
  next_action: {
    type: string;
    redirect_url?: string;
    url?: string;
    qr_code_url?: string;
    qr_url?: string;
  } | null;
}

export const getWalletBalance = async (): Promise<WalletResponse> => {
  const res = await api.get("/wallet");
  return res.data;
};

export const updateWalletVisibility = async (): Promise<WalletResponse> => {
  const res = await api.get("/wallet/update");
  return res.data;
};

export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  const res = await api.get("/wallet/transaction");
  return res.data.data;
};

// Fetch dynamic preset shortcuts from the server
export const getWalletPresets = async (): Promise<{ data: WalletPreset[] }> => {
  const res = await api.get("/wallet/presets");
  return res.data;
};

// Send recharge parameters to the server
export const rechargeWallet = async (
  payload: RechargePayload,
): Promise<RechargeResponse> => {
  const res = await api.post("/wallet/recharge", payload);
  return res.data;
};

export const getPaymentMethods = async () => {
  const res = await api.get("/payment-methods");
  return res.data;
};

export const checkMembershipPaymentStatus = async (paymentIntentId: string) => {
  const res = await api.get(`/payment/status/${paymentIntentId}`);
  return res.data;
};

export interface PaymentMethod {
  id: number;
  name: string;
  gateway_type: string;
}
