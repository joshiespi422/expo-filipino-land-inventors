import {
  ComputeLoanRequest,
  ComputeLoanResponse,
  LoanIndexResponse,
  PayLoanRequest,
} from "@/types/loan.types";
import api from "./api";

export const getLoans = async (): Promise<LoanIndexResponse> => {
  const res = await api.get("/loans");
  return res.data;
};

export const getLoan = async (id: string | number, params?: any) => {
  const res = await api.get(`/loans/${id}`, { params });

  // ✅ ALWAYS return full API response
  return res.data;
};

export const getLoanableAmount = async (): Promise<string> => {
  const res = await api.get("/loans/loanable-amount");
  return res.data?.data?.loanable_amount;
};

export const createLoan = async (payload: {
  amount: number;
  term: number;
  start_date: string;
  agree_terms: boolean;
}) => {
  const res = await api.post("/loans", payload);
  return res.data;
};

export const computeLoan = async (
  payload: ComputeLoanRequest,
): Promise<ComputeLoanResponse> => {
  const res = await api.get("/loans/compute", { params: payload });
  return res.data?.data;
};

export const payLoan = async (loanId: string, payload: PayLoanRequest) => {
  return await api.post(`/loans/${loanId}/pay`, payload);
};

export const checkPaymentStatus = async (paymentIntentId: string) => {
  const res = await api.get(`/payment/status/${paymentIntentId}`);
  return res.data;
};

export const getPaymentMethods = async () => {
  const res = await api.get("/payment-methods");
  return res.data;
};
