"use client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import api from "@/lib/api";

export default function SuperAdminAnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => (await api.get("/analytics/admin")).data,
  });

  const metrics = [
    { label: "Active learners", value: stats?.total_students ?? 0, icon: Users },
    { label: "Weekly growth", value: `${stats?.recent_activity?.[0]?.trend ?? "+0%"}`, icon: TrendingUp },
    { label: "Course engagement", value: `${stats?.active_enrollments ?? 0} active`, icon: BarChart3 },
  ];

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <h1 className="mb-1 text-2xl font-black text-slate-950">Analytics</h1>
      <p className="mb-8 text-sm text-slate-600">Monitor growth, engagement, and learner activity.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="page-surface rounded-2xl p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
              <Icon size={18} />
            </div>
            <p className="text-2xl font-black text-slate-950">{isLoading ? "—" : value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 page-surface rounded-3xl p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Performance snapshot</h2>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <span>Enrollment velocity</span>
            <span className="font-semibold text-brand-600">{stats?.recent_activity?.[0]?.trend ?? "Live"}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <span>Pending reviews</span>
            <span className="font-semibold text-emerald-600">{stats?.pending_reviews ?? 0}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <span>Certificates issued</span>
            <span className="font-semibold text-amber-600">{stats?.certificates_issued ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
