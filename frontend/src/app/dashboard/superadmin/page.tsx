"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SuperAdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["superadmin-stats"], queryFn: async () => (await api.get("/analytics/admin")).data });

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <h1 className="mb-1 text-2xl font-black text-white">Platform Analytics</h1>
      <p className="mb-8 text-sm text-white/40">Root administrator overview</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[{ label: "Total Users", value: stats?.total_students ?? 0, color: "text-purple-400" }, { label: "Students", value: stats?.total_students ?? 0, color: "text-brand-400" }, { label: "Total Revenue", value: `₦${((stats?.total_revenue ?? 0) / 1000000).toFixed(1)}M`, color: "text-yellow-400" }, { label: "Certs Issued", value: stats?.certificates_issued ?? 0, color: "text-green-400" }].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#071428] p-5">
            <p className={`mb-1 text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-3xl border border-white/10 bg-[#071428] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Platform pulse</h2>
        <div className="space-y-3 text-sm text-white/60">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#03091A] px-3 py-3">
            <span>Active enrollments</span>
            <span className="font-semibold text-brand-300">{stats?.active_enrollments ?? 0}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#03091A] px-3 py-3">
            <span>Pending certificate reviews</span>
            <span className="font-semibold text-amber-300">{stats?.pending_reviews ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
