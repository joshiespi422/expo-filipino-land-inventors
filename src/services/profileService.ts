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
    Object.keys(data).forEach((key) => {
      const skipKeys = [
        "front_valid_id_picture",
        "back_valid_id_picture",
        "avatar",
        "id",
      ];
      if (
        !skipKeys.includes(key) &&
        data[key] !== null &&
        data[key] !== undefined
      ) {
        formData.append(key, String(data[key]));
      }
    });

    const frontFile = normalizeFile(data.front_valid_id_picture, "front.jpg");
    if (frontFile) formData.append("front_valid_id_picture", frontFile as any);

    const backFile = normalizeFile(data.back_valid_id_picture, "back.jpg");
    if (backFile) formData.append("back_valid_id_picture", backFile as any);

    formData.append("_method", "PUT");

    const response = await api.post("/profile/update", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      transformRequest: (data) => data,
    });

    return response.data;
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
