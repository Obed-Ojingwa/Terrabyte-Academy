"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface Props { courseId: string; amount: number; courseName: string; mode: string; }

export default function PaystackButton({ courseId, amount, courseName, mode }: Props) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const handlePayment = async () => {
    if (!user) return toast.error("Please sign in to proceed");
    setLoading(true);
    try {
      const { data } = await api.post("/payments/initialize", null, { params: { course_id: courseId, mode } });
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.success(data.message || "Payment record created. Please follow up with support.");
      }
    } catch { toast.error("Payment initialization failed. Try again."); }
    finally { setLoading(false); }
  };
  return (
    <button onClick={handlePayment} disabled={loading} className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/50">
      {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Pay {formatCurrency(amount)} — {courseName}</>}
    </button>
  );
}
