import api from "./api"; // The red line should disappear now

export interface RegisterPayload {
  name: string;
  phone: string;
}

export const accountRegisterService = {
  register: async (payload: RegisterPayload) => {
    const { data } = await api.post("/register", payload);
    return data;
  },
};
