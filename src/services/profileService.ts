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
  // If there's no uri or the uri is a web URL, it's not a new file to upload
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
      avatar: normalizeImageUrl(attrs.avatar),
      front_valid_id_picture: normalizeImageUrl(attrs.front_valid_id_picture),
      back_valid_id_picture: normalizeImageUrl(attrs.back_valid_id_picture),
    };
  },

  updateProfile: async (data: any) => {
    const formData = new FormData();

    // 1. Append Text Fields
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

    // 2. Append Files (Only if they are new local URIs)
    const frontFile = normalizeFile(data.front_valid_id_picture, "front.jpg");
    if (frontFile) {
      // @ts-ignore
      formData.append("front_valid_id_picture", frontFile);
    }

    const backFile = normalizeFile(data.back_valid_id_picture, "back.jpg");
    if (backFile) {
      // @ts-ignore
      formData.append("back_valid_id_picture", backFile);
    }

    const response = await api.post("/profile/update", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data) => data, // Very important for React Native FormData
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
};
