import api from "./api";

export const getMembershipSettings = async () => {
  const res = await api.get("/memberships/settings");
  return res.data;
};

export const applyMembership = async (payload: { term_months: number }) => {
  const res = await api.post("/memberships/apply", payload);
  return res.data;
};

export const getMembership = async (params?: any) => {
  const res = await api.get("/memberships", { params });
  return res.data;
};

export const payMembership = async (
  scheduleId: string,
  payload: {
    payment_method_id: number | string;
    amount: number;
    gateway: string;
  },
) => {
  return await api.post(`/memberships/schedules/${scheduleId}/pay`, payload);
};

export const getPaymentMethods = async () => {
  const res = await api.get("/payment-methods");
  return res.data;
};

export const checkMembershipPaymentStatus = async (paymentIntentId: string) => {
  const res = await api.get(`/payment/status/${paymentIntentId}`);
  return res.data;
};
