"use client";
import { BarChart3, TrendingUp, Users } from "lucide-react";

const metrics = [
  { label: "Active learners", value: "1,248", icon: Users },
  { label: "Weekly growth", value: "+18%", icon: TrendingUp },
  { label: "Course engagement", value: "84%", icon: BarChart3 },
];

export default function SuperAdminAnalyticsPage() {
  return (
    <div className="min-h-full bg-[#03091A] p-6">
      <h1 className="mb-1 text-2xl font-black text-white">Analytics</h1>
      <p className="mb-8 text-sm text-white/40">Monitor growth, engagement, and learner activity.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-[#071428] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon size={18} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[#071428] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Performance snapshot</h2>
        <div className="space-y-3 text-sm text-white/60">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#03091A] px-3 py-3">
            <span>Enrollment velocity</span>
            <span className="font-semibold text-brand-300">+12 this week</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#03091A] px-3 py-3">
            <span>Completion rate</span>
            <span className="font-semibold text-emerald-300">78%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
