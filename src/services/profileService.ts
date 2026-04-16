import { Platform } from "react-native";
import api, { BASE_URL } from "./api";

// STORAGE BASE (IMPORTANT FIX)
const STORAGE_URL = `${BASE_URL}/storage/`;

const normalizeImageUrl = (path: string | null) => {
  if (!path) return null;

  // already full URL
  if (path.startsWith("http")) return path;

  return `${STORAGE_URL}${path}`;
};

const normalizeFile = (file: any, fallbackName: string) => {
  if (!file?.uri) return null;

  return {
    uri: Platform.OS === "ios" ? file.uri.replace("file://", "") : file.uri,
    name: file.name ?? fallbackName,
    type: file.type ?? "image/jpeg",
  };
};

export const profileService = {
  // =========================
  // GET PROFILE
  // =========================
  getProfile: async () => {
    const response = await api.get("/profile");
    const rawData = response.data.data;

    const attrs = rawData.attributes || {};

    return {
      id: rawData.id,
      ...attrs,

      status: attrs.status || null,
      user_type: attrs.user_type || null,

      // ✅ FIX IMAGE DISPLAY
      avatar: normalizeImageUrl(attrs.avatar),
      front_valid_id_picture: normalizeImageUrl(attrs.front_valid_id_picture),
      back_valid_id_picture: normalizeImageUrl(attrs.back_valid_id_picture),
    };
  },

  // =========================
  // UPDATE PROFILE
  // =========================
  updateProfile: async (data: any) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (
        key !== "front_valid_id_picture" &&
        key !== "back_valid_id_picture" &&
        key !== "avatar"
      ) {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      }
    });

    const frontFile = normalizeFile(data.front_valid_id_picture, "front.jpg");
    if (frontFile) {
      formData.append("front_valid_id_picture", frontFile as any);
    }

    const backFile = normalizeFile(data.back_valid_id_picture, "back.jpg");
    if (backFile) {
      formData.append("back_valid_id_picture", backFile as any);
    }

    const response = await api.post("/profile/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });

    const rawData = response.data.data;
    const attrs = rawData.attributes || {};

    return {
      success: response.data.success,
      message: response.data.message,
      data: {
        id: rawData.id,
        ...attrs,
        // ✅ FIX UPDATED IMAGE RETURN
        front_valid_id_picture: normalizeImageUrl(attrs.front_valid_id_picture),
        back_valid_id_picture: normalizeImageUrl(attrs.back_valid_id_picture),
      },
    };
  },

  changePassword: async (passwords: any) => {
    const response = await api.patch("/profile/change-password", passwords);
    return response.data;
  },
};
