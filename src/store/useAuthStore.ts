import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  setAuth: (token: string, user: any) => Promise<void>;
  setUser: (user: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Helper to extract attributes from JSON:API structure
const flattenUser = (obj: any) => {
  if (!obj) return null;

  if (obj.data?.attributes) {
    return { id: obj.data.id, ...obj.data.attributes };
  }
  if (obj.attributes) {
    return { id: obj.id, ...obj.attributes };
  }
  if (obj.data) {
    return obj.data;
  }
  return obj;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const userStr = await SecureStore.getItemAsync("user_data");

      if (token && userStr) {
        set({
          token,
          user: JSON.parse(userStr),
        });

        const { refreshUser } = get();
        await refreshUser();
      }
    } catch (e) {
      console.error("Failed to initialize auth store:", e);
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const { token } = get();
      if (!token) return;

      const response = await api.get("/profile");

      // Flatten the JSON:API response
      const freshUser = flattenUser(response.data);

      await SecureStore.setItemAsync("user_data", JSON.stringify(freshUser));
      set({ user: freshUser });

      // console.log("Auth Store: User synced. Type ID:", freshUser?.user_type_id);
    } catch (e) {
      console.error("Auth Store: Failed to sync user data:", e);
    }
  },

  setAuth: async (token: string, user: any) => {
    try {
      const userRaw = typeof user === "string" ? JSON.parse(user) : user;

      // Flatten the user object before saving
      const userObject = flattenUser(userRaw);

      await SecureStore.setItemAsync("auth_token", token);
      await SecureStore.setItemAsync("user_data", JSON.stringify(userObject));

      set({
        token,
        user: userObject,
        isLoading: false,
      });

      // console.log("Auth Store: Login successful. Name:", userObject?.name);
    } catch (e) {
      console.error("Error saving auth session:", e);
      throw e;
    }
  },

  setUser: async (user) => {
    try {
      const currentState = get();
      const userUpdate = flattenUser(user);
      const updatedUser = { ...currentState.user, ...userUpdate };

      await SecureStore.setItemAsync("user_data", JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (e) {
      console.error("Error updating user data:", e);
    }
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
      set({ token: null, user: null, isLoading: false });
    } catch (e) {
      console.error("Error clearing auth session:", e);
    }
  },
}));
