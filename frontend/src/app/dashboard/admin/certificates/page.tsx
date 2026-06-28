"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

export default function AdminCertificatesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => (await api.get("/certificates/")).data,
  });

  const approveCertificate = useMutation({
    mutationFn: async (certificateId: string) => api.put(`/certificates/${certificateId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      toast.success("Certificate approved");
    },
    onError: () => toast.error("Unable to approve certificate"),
  });

  const certificates = Array.isArray(data) ? data : [];
  const pendingCount = certificates.filter((item: any) => item.status !== "issued").length;

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Certificate approvals</h1>
          <p className="mt-1 text-sm text-slate-500">Review requests and issue certificates quickly.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-900">{pendingCount}</span> pending
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading certificate requests...</p>
        ) : certificates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No certificate requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((certificate: any) => (
              <div key={certificate.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-500" />
                    <p className="font-semibold text-slate-950">{certificate.certificate_number}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {certificate.student?.first_name} {certificate.student?.last_name}
                  </p>
                  <p className="text-sm text-slate-500">{certificate.course?.title ?? "Course"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${certificate.status === "issued" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                    {certificate.status === "issued" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                    {certificate.status}
                  </span>
                  {certificate.status !== "issued" && (
                    <button onClick={() => approveCertificate.mutate(certificate.id)} disabled={approveCertificate.isPending} className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
