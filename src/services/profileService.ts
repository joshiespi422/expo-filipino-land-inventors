import { Platform } from "react-native";
import api, { BASE_URL } from "./api";

const STORAGE_URL = `${BASE_URL}/storage/`;

const normalizeImageUrl = (path: string | null) => {
  if (!path) return null;

  if (path.startsWith("http")) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  return `${STORAGE_URL}${cleanPath}`;
};

const normalizeFile = (file: any, fallbackName: string) => {
  if (!file?.uri || file.uri.startsWith("http")) {
    return null;
  }

  return {
    uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,

    name: file.name || fallbackName,

    type: file.type || "image/jpeg",
  };
};

export const profileService = {
  /*
  |--------------------------------------------------------------------------
  | GET PROFILE
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | UPDATE PROFILE
  |--------------------------------------------------------------------------
  */

  updateProfile: async (data: any) => {
    const formData = new FormData();

    /*
    |--------------------------------------------------------------------------
    | File fields that should not be appended as normal strings
    |--------------------------------------------------------------------------
    */

    const skipKeys = [
      "front_valid_id_picture",
      "back_valid_id_picture",
      "avatar",
      "id",
    ];

    /*
    |--------------------------------------------------------------------------
    | NORMAL FORM FIELDS
    |--------------------------------------------------------------------------
    */

    Object.keys(data).forEach((key) => {
      if (skipKeys.includes(key)) {
        return;
      }

      const value = data[key];

      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, String(value));
      }
    });

    /*
    |--------------------------------------------------------------------------
    | FRONT ID
    |--------------------------------------------------------------------------
    */

    const frontFile = normalizeFile(data.front_valid_id_picture, "front.jpg");

    if (frontFile) {
      // @ts-ignore
      formData.append("front_valid_id_picture", frontFile);
    }

    /*
    |--------------------------------------------------------------------------
    | BACK ID
    |--------------------------------------------------------------------------
    */

    const backFile = normalizeFile(data.back_valid_id_picture, "back.jpg");

    if (backFile) {
      // @ts-ignore
      formData.append("back_valid_id_picture", backFile);
    }

    /*
    |--------------------------------------------------------------------------
    | Laravel PUT METHOD SPOOFING
    |--------------------------------------------------------------------------
    */

    formData.append("_method", "PUT");

    try {
      const response = await api.post("/profile/update", formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },

        transformRequest: (data) => data,
      });

      return response.data;
    } catch (error: any) {
      console.error("Profile update error:", error.response?.data || error);

      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE AVATAR
  |--------------------------------------------------------------------------
  */

  updateAvatar: async (fileData: any) => {
    const formData = new FormData();

    const fileToUpload = normalizeFile(fileData, "avatar.jpg");

    if (!fileToUpload) {
      throw new Error("No new image selected");
    }

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

  /*
  |--------------------------------------------------------------------------
  | CHANGE PASSWORD
  |--------------------------------------------------------------------------
  */

  changePassword: async (passwords: any) => {
    const response = await api.patch("/profile/change-password", passwords);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | ADDRESSES
  |--------------------------------------------------------------------------
  */

  getAddresses: async () => {
    const response = await api.get("/profile/addresses");

    return response.data.data || [];
  },

  addAddress: async (addressData: any) => {
    const response = await api.post("/profile/address", addressData);

    return response.data;
  },

  updateAddress: async (id: number, addressData: any) => {
    const response = await api.put(`/profile/address/${id}`, addressData);

    return response.data;
  },

  deleteAddress: async (id: number) => {
    const response = await api.delete(`/profile/address/${id}`);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | AUTH DEVICES / BIOMETRIC
  |--------------------------------------------------------------------------
  */

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
