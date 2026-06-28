"use client";
import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsIcon, ShieldCheck, BellRing } from "lucide-react";
import api from "@/lib/api";

export default function SuperAdminSettingsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => (await api.get("/analytics/admin")).data,
  });

  const settingsCards = [
    { title: "Security", description: `There are ${stats?.admin_users ?? 0} admin accounts with platform access.`, icon: ShieldCheck },
    { title: "Notifications", description: `${stats?.pending_reviews ?? 0} certificate reviews are pending attention.`, icon: BellRing },
  ];

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <h1 className="mb-1 text-2xl font-black text-white">Platform Settings</h1>
      <p className="mb-8 text-sm text-white/40">Adjust system preferences and operational controls.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map(({ title, description, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-white/[0.06] bg-[#071428] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon size={18} />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-white/40">{isLoading ? "Loading…" : description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[#071428] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
            <SettingsIcon size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System status</h2>
            <p className="text-sm text-white/40">{isLoading ? "Loading system metrics…" : `Platform health is based on ${stats?.active_enrollments ?? 0} active enrollments and ${stats?.certificates_issued ?? 0} issued certificates.`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
