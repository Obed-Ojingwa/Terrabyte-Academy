"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import api from "@/lib/api";

type Payment = {
  id: string;
  student_name?: string;
  student_email?: string;
  course_title?: string;
  amount: number;
  currency: string;
  gateway: string;
  gateway_ref?: string;
  status: string;
  message?: string;
  review_message?: string;
  created_at: string;
  paid_at?: string;
};

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => (await api.get("/payments/history")).data,
    refetchInterval: 15_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      (await api.put(`/payments/${id}/review`, { decision })).data,
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || "Unable to review payment"),
  });

  const payments: Payment[] = data?.items ?? [];
  const reportsAwaitingReview = payments.filter((payment) => payment.status === "reported").length;

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Course payments</h1>
          <p className="mt-1 text-sm text-slate-500">Review student payment reports and confirm course access.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {reportsAwaitingReview > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
          {reportsAwaitingReview} student payment {reportsAwaitingReview === 1 ? "report needs" : "reports need"} review.
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading payment history...</p>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-700">Unable to load payments.</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand-700">Try again</button>
          </div>
        ) : payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No course payments have been recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <article key={payment.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{payment.course_title || "Course"}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        payment.status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : payment.status === "reported"
                            ? "bg-amber-50 text-amber-800"
                            : payment.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                      }`}>
                        {payment.status === "reported" ? "Needs review" : payment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{payment.student_name || "Student"} · {payment.student_email || "No email"}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {payment.currency} {Number(payment.amount).toLocaleString("en-NG")}
                      <span className="ml-2 font-normal text-slate-500">via {payment.gateway}</span>
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {payment.gateway_ref ? `Reference: ${payment.gateway_ref} · ` : ""}
                      Reported {new Date(payment.created_at).toLocaleString("en-NG")}
                    </p>
                    {payment.message && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Student note: {payment.message}</p>
                    )}
                    {payment.review_message && (
                      <p className="mt-2 text-sm text-red-700">Admin note: {payment.review_message}</p>
                    )}
                  </div>
                  {payment.status === "reported" && (
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => reviewMutation.mutate({ id: payment.id, decision: "approve" })}
                        disabled={reviewMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Approve & unlock
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewMutation.mutate({ id: payment.id, decision: "reject" })}
                        disabled={reviewMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
