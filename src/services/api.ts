import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";

// 1. Define base constants
export const devIP = "192.168.1.53:8000";
export const BASE_URL = `http://${devIP}`;
export const ICON_PATH = `${BASE_URL}/storage/businessIcon`;

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
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
  (error) => Promise.reject(error),
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
