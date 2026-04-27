import api from "./api";

export const getMembershipSettings = async () => {
  const res = await api.get("/memberships/settings");
  return res.data;
};

export const applyMembership = async (payload: { term_months: number }) => {
  const res = await api.post("/memberships/apply", payload);
  return res.data; // Returns ApiMembershipResource
};

export const getMembership = async (params?: any) => {
  const res = await api.get("/memberships", { params });
  return res.data;
};

export const payMembership = async (
  scheduleId: string,
  payload: { payment_method_id: number },
) => {
  const res = await api.post(
    `/memberships/schedules/${scheduleId}/pay`,
    payload,
  );
  return res.data;
};
