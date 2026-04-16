export type LoanStatus =
  | "pending"
  | "active"
  | "finished"
  | "rejected"
  | string;

export interface Loan {
  id: number;
  type: string;
  attributes: {
    amount: string;
    interest_rate: string;
    term_months: number;
    monthly_principal: string;
    start_date: string;
    end_date: string;
    status: LoanStatus;
  };
  // Relationships usually sit outside attributes in JSON:API
  relationships?: {
    loanSchedules?: { data: LoanSchedule[] };
    loanPayments?: { data: LoanPayment[] };
  };
}

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

export interface LoanPayment {
  id: number;
  amount: string;
  payment_date: string;
  payment_method?: string;
}

export interface LoanableAmountResponse {
  loanable_amount: string;
}

export interface ComputeLoanRequest {
  amount: number;
  term: number;
  start_date?: string;
}

export interface ComputeLoanResponse {
  loan_amount: string;
  term_months: number;
  interest_rate: string;
  release_date: string;
  total_payment: string;
  schedule: {
    month: number;
    due_date: string;
    principal: string;
    interest: string;
    monthly_payment: string;
    ending_balance: string;
  }[];
}

export interface PayLoanRequest {
  amount: number;
  payment_date: string;
  schedule_id: number;
}
