import {
  ComputeLoanRequest,
  ComputeLoanResponse,
  Loan,
  PayLoanRequest,
} from "@/types/loan.types";
import api from "./api";

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

export const getLoans = async (): Promise<LoanIndexResponse> => {
  const res = await api.get("/loans");
  return res.data;
};

export const getLoan = async (id: number | string): Promise<Loan> => {
  const res = await api.get(`/loans/${id}`);
  return res.data?.data ?? res.data;
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

export const getLoanableAmount = async (): Promise<string> => {
  const res = await api.get("/loans/loanable-amount");
  return res.data?.data?.loanable_amount;
};

export const computeLoan = async (
  payload: ComputeLoanRequest,
): Promise<ComputeLoanResponse> => {
  const res = await api.get("/loans/compute", {
    params: payload,
  });

  return res.data?.data;
};

export const payLoan = async (
  loanId: number | string,
  payload: PayLoanRequest,
) => {
  const res = await api.post(`/loans/${loanId}/pay`, payload);
  return res.data;
};
