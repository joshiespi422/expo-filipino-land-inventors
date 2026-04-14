import api from "./api";

export interface VerifyPayload {
  phone: string;
  otp_code: string;
}

export interface ResendPayload {
  phone: string;
}

export const phoneVerificationService = {
  formatPhone: (phone: string) => {
    if (!phone) return "";
    if (phone.startsWith("0")) return `63${phone.substring(1)}`;
    return phone;
  },

  verify: async (data: VerifyPayload) => {
    const response = await api.post("/verify-phone/acknowledge", {
      phone: phoneVerificationService.formatPhone(data.phone),
      otp_code: data.otp_code,
    });
    return response.data;
  },

  resend: async (data: ResendPayload) => {
    const response = await api.post("/verify-phone/resend", {
      phone: phoneVerificationService.formatPhone(data.phone),
    });
    return response.data;
  },
};
