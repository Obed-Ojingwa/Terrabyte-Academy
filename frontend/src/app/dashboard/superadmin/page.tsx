"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SuperAdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["superadmin-stats"], queryFn: async () => (await api.get("/analytics/admin")).data });

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <h1 className="mb-1 text-2xl font-black text-slate-950">Platform Analytics</h1>
      <p className="mb-8 text-sm text-slate-600">Root administrator overview</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[{ label: "Total Users", value: stats?.total_students ?? 0, color: "text-violet-600" }, { label: "Students", value: stats?.total_students ?? 0, color: "text-slate-950" }, { label: "Total Revenue", value: `₦${((stats?.total_revenue ?? 0) / 1000000).toFixed(1)}M`, color: "text-amber-600" }, { label: "Certs Issued", value: stats?.certificates_issued ?? 0, color: "text-emerald-600" }].map((s) => (
          <div key={s.label} className="page-surface rounded-2xl p-5">
            <p className={`mb-1 text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 page-surface rounded-3xl p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Platform pulse</h2>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <span>Active enrollments</span>
            <span className="font-semibold text-brand-600">{stats?.active_enrollments ?? 0}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <span>Pending certificate reviews</span>
            <span className="font-semibold text-amber-600">{stats?.pending_reviews ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
