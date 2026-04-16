import {
  ComputeLoanRequest,
  ComputeLoanResponse,
  Loan,
  PayLoanRequest,
} from "@/types/loan.types";
import api from "./api";

// Ensure this matches your backend response fields
export interface LoanSchedule {
  id: number;
  month_no: number;
  beginning_balance: string;
  interest_amount: string;
  principal_amount: string;
  total_payment: string;
  ending_balance: string;
  due_date: string;
  status: string;
}

export interface LoanIndexResponse {
  data: Loan[];
  meta: {
    loanable_amount: string;
    settings: {
      default_amount: string;
      default_interest_rate: string;
      default_term_months: number;
    } | null;
  };
}

/**
 * GET /loans
 */
export const getLoans = async (): Promise<LoanIndexResponse> => {
  const res = await api.get("/loans");
  return res.data;
};

/**
 * GET /loans/{id}
 * Handle both string and number for the ID
 */
export const getLoan = async (id: number | string): Promise<Loan> => {
  const res = await api.get(`/loans/${id}`);
  // Check if your API returns the object inside a 'data' key
  return res.data?.data ?? res.data;
};

/**
 * POST /loans
 */
export const createLoan = async (payload: {
  amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
}) => {
  const res = await api.post("/loans", payload);
  return res.data;
};

/**
 * GET /loans/loanable-amount
 */
export const getLoanableAmount = async (): Promise<string> => {
  const res = await api.get("/loans/loanable-amount");
  return res.data?.data?.loanable_amount;
};

/**
 * GET /loans/compute
 */
export const computeLoan = async (
  payload: ComputeLoanRequest,
): Promise<ComputeLoanResponse> => {
  const res = await api.get("/loans/compute", {
    params: payload,
  });
  return res.data?.data;
};

/**
 * POST /loans/{id}/pay
 */
export const payLoan = async (
  loanId: number | string,
  payload: PayLoanRequest,
) => {
  const res = await api.post(`/loans/${loanId}/pay`, payload);
  return res.data;
};
