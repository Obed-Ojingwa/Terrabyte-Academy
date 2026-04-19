export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  gateway: string;
  gateway_ref?: string;
  payment_type: string;
  created_at: string;
  paid_at?: string;
}
