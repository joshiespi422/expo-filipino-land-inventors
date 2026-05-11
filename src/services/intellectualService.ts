import api from "./api";

/**
 * Checks if the application is in a state where the user can still modify it.
 */
export const isEditable = (resource: any): boolean => {
  if (!resource || !resource.attributes) return false;
  const status = resource.attributes.status?.toLowerCase();
  // Applications are editable only if Pending or Rejected
  return ["pending", "rejected"].includes(status);
};

export const getIntellectualProperties = async (params?: any) => {
  const res = await api.get("/intellectual-properties", { params });
  return res.data;
};

export const getIntellectualProperty = async (id: number | string) => {
  // Requesting includes to ensure relationships are populated in the 'included' key
  const res = await api.get(
    `/intellectual-properties/${id}?include=claims,documents,schedules,status,settings`,
  );
  return res.data;
};

export const createIntellectualProperty = async (payload: FormData) => {
  const res = await api.post("/intellectual-properties", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateIntellectualProperty = async (
  id: number | string,
  payload: FormData,
) => {
  // Using POST with _method=PUT for better FormData compatibility in Laravel
  const res = await api.post(
    `/intellectual-properties/${id}?_method=PUT`,
    payload,
    {
      headers: { "Content-Type": "multipart/form-data" },
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
  payload: { payment_method_id: number | string },
) => {
  const res = await api.post(
    `/intellectual-properties/schedules/${scheduleId}/pay`,
    payload,
  );
  return res.data;
};
