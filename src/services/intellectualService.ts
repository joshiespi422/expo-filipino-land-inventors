import api from "./api";

export const getIntellectualProperties = async (params?: any) => {
  const res = await api.get("/intellectual-properties", { params });
  return res.data;
};

export const getIntellectualProperty = async (id: number | string) => {
  const res = await api.get(`/intellectual-properties/${id}`);
  return res.data;
};

export const createIntellectualProperty = async (payload: FormData) => {
  const res = await api.post("/intellectual-properties", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updateIntellectualProperty = async (
  id: number | string,
  payload: FormData,
) => {
  const res = await api.post(
    `/intellectual-properties/${id}?_method=PUT`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
};

export const getIntellectualSettings = async (id: number | string) => {
  const res = await api.get(`/intellectual-properties/${id}/settings`);
  return res.data;
};

export const applyIntellectualPayment = async (
  id: number | string,
  payload: { term_months: number },
) => {
  const res = await api.post(
    `/intellectual-properties/${id}/apply/payment`,
    payload,
  );
  return res.data;
};

export const payIntellectual = async (
  scheduleId: number | string,
  payload: {
    payment_method_id: number | string;
  },
) => {
  const res = await api.post(
    `/intellectual-properties/schedules/${scheduleId}/pay`,
    payload,
  );
  return res.data;
};
