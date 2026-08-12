import { Platform } from "react-native";
import api, { BASE_URL } from "./api";

const STORAGE_URL = `${BASE_URL}/storage/`;

const normalizeImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `${STORAGE_URL}${cleanPath}`;
};

const normalizeFile = (file: any, fallbackName: string) => {
  if (!file?.uri || file.uri.startsWith("http")) return null;
  return {
    uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
    name: file.name || fallbackName,
    type: file.type || "image/jpeg",
  };
};

export const profileService = {
  getProfile: async () => {
    const response = await api.get("/profile");
    const rawData = response.data.data;
    const attrs = rawData.attributes || rawData || {};

    return {
      id: rawData.id,
      ...attrs,
      is_seller: !!attrs.is_seller,
      avatar: normalizeImageUrl(attrs.avatar),
      front_valid_id_picture: normalizeImageUrl(attrs.front_valid_id_picture),
      back_valid_id_picture: normalizeImageUrl(attrs.back_valid_id_picture),
    };
  },

  updateProfile: async (data: any) => {
    const formData = new FormData();

    // List of file fields we'll handle separately
    const skipKeys = [
      "front_valid_id_picture",
      "back_valid_id_picture",
      "avatar",
      "id",
    ];

    // Append all non-file fields
    Object.keys(data).forEach((key) => {
      if (!skipKeys.includes(key)) {
        const value = data[key];

        // Skip null, undefined, or empty strings
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, String(value));
        }
      }
    });

    // Handle front ID picture
    const frontFile = normalizeFile(data.front_valid_id_picture, "front.jpg");
    if (frontFile) {
      // @ts-ignore
      formData.append("front_valid_id_picture", frontFile);
    }

    // Handle back ID picture
    const backFile = normalizeFile(data.back_valid_id_picture, "back.jpg");
    if (backFile) {
      // @ts-ignore
      formData.append("back_valid_id_picture", backFile);
    }

    // Use PUT method via _method for compatibility
    formData.append("_method", "PUT");

    try {
      const response = await api.post("/profile/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: (data) => data,
      });

      return response.data;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  },

  updateAvatar: async (fileData: any) => {
    const formData = new FormData();
    const fileToUpload = normalizeFile(fileData, "avatar.jpg");
    if (!fileToUpload) throw new Error("No new image selected");
    // @ts-ignore
    formData.append("avatar", fileToUpload);

    const response = await api.post("/profile/avatar", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data) => data,
    });
    return response.data;
  },

  changePassword: async (passwords: any) => {
    const response = await api.patch("/profile/change-password", passwords);
    return response.data;
  },

  // --- NEW ADDRESS ENDPOINTS ---
  getAddresses: async () => {
    const response = await api.get("/profile/addresses");
    return response.data.data || [];
  },

  addAddress: async (addressData: any) => {
    const response = await api.post("/profile/address", addressData);
    return response.data;
  },

  updateAddress: async (id: number, addressData: any) => {
    // Adjust path matching your API routing setup if necessary
    const response = await api.put(`/profile/address/${id}`, addressData);
    return response.data;
  },

  deleteAddress: async (id: number) => {
    const response = await api.delete(`/profile/address/${id}`);
    return response.data;
  },

  // --- QUICK AND SECURE LOGIN / BIOMETRIC

  getAuthDevices: async () => {
    const response = await api.get("/profile/auth-devices");
    return response.data.data || [];
  },

  registerAuthDevice: async (data: {
    device_id: string;
    platform: "android" | "ios";
    public_key: string;
    device_name?: string;
  }) => {
    const response = await api.post("/profile/auth-devices", data);
    return response.data;
  },

  disableAuthDevice: async (id: number) => {
    const response = await api.patch(`/profile/auth-devices/${id}/disable`);

    return response.data;
  },

  removeAuthDevice: async (id: number) => {
    const response = await api.delete(`/profile/auth-devices/${id}`);

    return response.data;
  },
};
