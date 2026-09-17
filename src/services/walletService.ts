import api from "./api";

///////////////// Wallet //////////////////

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
export const getWalletPresets = async (): Promise<{
  data: WalletPreset[];
}> => {
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

///////////////// Wallet Transfer //////////////////

export interface TransferPayload {
  channel_id: string;
  amount: number;
  account_name: string;
  account_number: string;
  purpose?: string;
  remarks?: string;
}

export interface TransferResource {
  id: number;
  reference_number: string;
  status: string;
  channel: string;
  destination_account_name: string;
  destination_account_number: string;
  amount: string;
  fee: string;
  total_deducted: string;
  created_at: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: TransferResource;
  wallet: WalletResponse;
}

export const createTransfer = async (
  payload: TransferPayload,
): Promise<TransferResponse> => {
  const res = await api.post("/wallet/transfer", payload);
  return res.data;
};

export const getTransferStatus = async (
  reference: string,
): Promise<{ data: TransferResource }> => {
  const res = await api.get(`/wallet/transfer/${reference}`);
  return res.data;
};

///////////////// QR Resolution //////////////////

export interface ResolveQrPayload {
  qr_payload: string;
}

export interface ResolveQrResource {
  provider?: string;
  account_name?: string;
  account_number?: string;
  amount?: number;
  qr_type?: string;
  raw?: string;
}

export interface ResolveQrResponse {
  success: boolean;
  message: string;
  data?: ResolveQrResource;
}

export const resolveQr = async (
  payload: ResolveQrPayload,
): Promise<ResolveQrResponse> => {
  const res = await api.post("/wallet/transfer/resolve-qr", payload);
  return res.data;
};
