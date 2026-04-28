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

/**
 * ✅ FIXED: return raw response safely
 */
export const payMembership = async (
  scheduleId: string,
  payload: {
    payment_method_id: number | string;
    amount: number;
    gateway: string;
  },
) => {
  try {
    const res = await api.post(
      `/memberships/schedules/${scheduleId}/pay`,
      payload,
    );

    return res.data;
  } catch (error: any) {
    console.log("❌ payMembership error:", error?.response?.data || error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Payment request failed",
    };
  }
};

export const getPaymentMethods = async () => {
  const res = await api.get("/payment-methods");
  return res.data;
};

export const checkMembershipPaymentStatus = async (paymentIntentId: string) => {
  const res = await api.get(`/payments/status/${paymentIntentId}`);
  return res.data;
};
