import api from "./api";

export const authService = {
  login: async (phone: string, password: string) => {
    try {
      const response = await api.post("/login", {
        phone: phone,
        password: password,
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { message: "Network error. Please check your connection." };
    }
  },

  logout: async (token: string) => {
    try {
      const response = await api.post(
        "/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw new Error("Logout failed. Please try again.");
    }
  },
};
