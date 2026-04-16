import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  setAuth: (token: string, user: any) => Promise<void>;
  setUser: (user: any) => Promise<void>; // Added this to fix your error
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

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
      }
    } catch (e) {
      console.error("Failed to initialize auth store:", e);
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
    } finally {
      set({ isLoading: false });
    }
  },

  // This handles the initial Login
  setAuth: async (token, user) => {
    try {
      const userString = typeof user === "string" ? user : JSON.stringify(user);
      const userObject = typeof user === "string" ? JSON.parse(user) : user;

      await SecureStore.setItemAsync("auth_token", token);
      await SecureStore.setItemAsync("user_data", userString);

      set({
        token,
        user: userObject,
        isLoading: false,
      });
    } catch (e) {
      console.error("Error saving auth session:", e);
      throw e;
    }
  },

  // NEW: Specifically for updating profile data without touching the token
  setUser: async (user) => {
    try {
      const userObject = typeof user === "string" ? JSON.parse(user) : user;
      const currentState = get();
      const updatedUser = { ...currentState.user, ...userObject };

      await SecureStore.setItemAsync("user_data", JSON.stringify(updatedUser));

      set({ user: updatedUser });
      console.log("Auth Store: User data merged and saved");
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
