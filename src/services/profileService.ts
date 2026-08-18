import api, { BASE_URL } from "./api";

const STORAGE_URL = `${BASE_URL}/storage/`;

// ---------------------------------------------------------
// FIX #1: cache-busting
//
// If the backend stores the ID photo at the SAME path every time you
// re-upload (e.g. "valid_ids/123_front.jpg"), the URL returned here is
// byte-for-byte identical before and after a re-crop. React Native's
// <Image> component caches by URI, so it keeps showing the OLD bitmap even
// though the file on the server has changed — this looks exactly like "my
// crop isn't being applied" even when the crop itself is perfectly correct.
//
// `updatedAt` (pass the profile's updated_at / any per-record timestamp or
// version you already have) forces a fresh network fetch after every save.
// If you don't have an updatedAt handy, Date.now() also works — it just
// means the image is never cached between app opens, which is a fine
// trade-off for a small ID photo.
// ---------------------------------------------------------
const normalizeImageUrl = (
  path: string | null,
  updatedAt?: string | number | null,
) => {
  if (!path) return null;

  const withCacheBust = (url: string) => {
    if (!updatedAt) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(String(updatedAt))}`;
  };

  if (path.startsWith("http")) return withCacheBust(path);

  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return withCacheBust(`${STORAGE_URL}${cleanPath}`);
};

const normalizeFile = (file: any, fallbackName: string) => {
  if (!file?.uri || file.uri.startsWith("http")) {
    return null;
  }
  return {
    // ---------------------------------------------------------
    // FIX #2: keep the `file://` scheme on iOS too.
    //
    // Stripping it (the old `.replace("file://", "")` workaround) can cause
    // the multipart file part to fail to attach on current Expo/RN
    // versions — the rest of the form fields save fine, but the picture
    // itself silently never updates server-side. Current Expo guidance is
    // to pass the uri through unchanged on both platforms.
    // ---------------------------------------------------------
    uri: file.uri,
    name: file.name || fallbackName,
    type: file.type || "image/jpeg",
  };
};

export const profileService = {
  getProfile: async () => {
    const response = await api.get("/profile");
    const rawData = response.data.data;
    const attrs = rawData.attributes || rawData || {};

    // `updated_at` (if your API returns it) is the ideal cache-bust key —
    // it only changes when the record actually changes. Falls back to
    // Date.now() if the API doesn't send one, which still fixes staleness
    // at the cost of never caching the image between loads.
    const cacheBust = attrs.updated_at ?? Date.now();

    return {
      id: rawData.id,
      ...attrs,
      is_seller: !!attrs.is_seller,
      avatar: normalizeImageUrl(attrs.avatar, cacheBust),
      front_valid_id_picture: normalizeImageUrl(
        attrs.front_valid_id_picture,
        cacheBust,
      ),
      back_valid_id_picture: normalizeImageUrl(
        attrs.back_valid_id_picture,
        cacheBust,
      ),
    };
  },

  updateProfile: async (data: any) => {
    const formData = new FormData();
    const skipKeys = [
      "front_valid_id_picture",
      "back_valid_id_picture",
      "avatar",
      "id",
    ];

    Object.keys(data).forEach((key) => {
      if (skipKeys.includes(key)) return;
      const value = data[key];
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, String(value));
      }
    });

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

  updateAvatar: async (
    fileData: any,
    onProgress?: (percent: number) => void,
  ) => {
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
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        }
      },
    });

    return response.data;
  },

  changePassword: async (passwords: any) => {
    const response = await api.patch("/profile/change-password", passwords);
    return response.data;
  },

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
