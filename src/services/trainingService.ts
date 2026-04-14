import api from "./api";

export const trainingService = {
  getTypes: async () => {
    try {
      const response = await api.get("/business-training/types");
      return response.data.data; // ✅ FIXED
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getCategories: async (typeSlug: string) => {
    try {
      const response = await api.get(
        `/business-training/types/${typeSlug}/categories`,
      );
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getCategoryDetails: async (typeSlug: string, categorySlug: string) => {
    try {
      const response = await api.get(
        `/business-training/types/${typeSlug}/categories/${categorySlug}`,
      );
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  getTrainings: async (categorySlug: string) => {
    try {
      const response = await api.get(
        `/business-training/categories/${categorySlug}/trainings`,
      );
      return response.data.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // services/trainingService.ts
  getModule: async (categorySlug: string, moduleNumber: number) => {
    try {
      const response = await api.get(
        `/business-training/categories/${categorySlug}/trainings/${moduleNumber}`,
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};
