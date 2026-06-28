"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PublicHeader from "@/components/ui/PublicHeader";
import api from "@/lib/api";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams?.get("reference") || "";
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!reference) {
      return;
    }

    const verify = async () => {
      setLoading(true);
      setStatus("idle");
      try {
        const { data } = await api.post(`/payments/verify/${reference}`);
        setStatus("success");
        setMessage(data.message || "Payment verification succeeded.");
        setTimeout(() => router.push("/dashboard/student/courses"), 2500);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || "Unable to verify payment. Please sign in and try again.";
        setStatus("error");
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [reference, router]);

  return (
    <div className="page-light min-h-screen pt-20 text-slate-950">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
            {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : status === "success" ? <CheckCircle2 className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
          </div>
          <h1 className="text-3xl font-black text-slate-950">Payment verification</h1>
          <p className="mt-4 text-slate-600">{reference ? "Verifying your payment reference now." : "Provide a payment reference to verify your enrollment."}</p>

          {reference ? (
            <div className="mt-8 space-y-4 text-left">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Reference</p>
                <p className="mt-2 font-semibold text-slate-900 break-all">{reference}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className={`text-sm ${status === "success" ? "text-emerald-700" : status === "error" ? "text-red-700" : "text-slate-500"}`}>
                  {message || (loading ? "Please wait while we confirm your payment." : "Waiting for Paystack confirmation.")}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-sm text-slate-600">If you were redirected from Paystack, the reference should be included in the URL.</p>
              <p className="mt-3 text-sm text-slate-600">If not, please return to the course page and retry the payment.</p>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/public/courses" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-all">
              Browse courses
            </Link>
            <Link href="/dashboard/student/courses" className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-all">
              My enrolled courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
