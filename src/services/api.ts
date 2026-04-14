import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";

// Your development machine IP
const devIP = "192.168.1.53:8000";

const api = axios.create({
  baseURL: `http://${devIP}/api`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized request - Clearing local session.");
      await useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

export default api;
