import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  setAuth: (token: string, user: any) => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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
      }
    } catch (e) {
      console.error("Failed to initialize auth store:", e);
      // If data is corrupt, clear it
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
    } finally {
      set({ isLoading: false });
    }
  },

  setAuth: async (token, user) => {
    try {
      // Robust Handling: Determine if user is already a string or an object
      const userString = typeof user === "string" ? user : JSON.stringify(user);
      const userObject = typeof user === "string" ? JSON.parse(user) : user;

      // 1. Save to physical storage
      await SecureStore.setItemAsync("auth_token", token);
      await SecureStore.setItemAsync("user_data", userString);

      // 2. Update Zustand state
      set({
        token,
        user: userObject,
        isLoading: false,
      });

      console.log("Auth Store: Session saved successfully");
    } catch (e) {
      console.error("Error saving auth session:", e);
      throw e;
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
