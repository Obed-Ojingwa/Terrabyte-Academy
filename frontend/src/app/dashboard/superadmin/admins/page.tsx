"use client";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, UserPlus } from "lucide-react";
import api from "@/lib/api";

export default function SuperAdminAdminsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => (await api.get("/analytics/admin")).data,
  });

  const adminHighlights = [
    { label: "Active Admins", value: stats?.admin_users ?? 0, icon: ShieldCheck },
    { label: "Pending Invitations", value: 0, icon: UserPlus },
    { label: "Total Team Members", value: (stats?.admin_users ?? 0) + (stats?.total_students ?? 0), icon: Users },
  ];

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <h1 className="mb-1 text-2xl font-black text-white">Admin Management</h1>
      <p className="mb-8 text-sm text-white/40">Manage platform admins and access control.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {adminHighlights.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/[0.06] bg-[#071428] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon size={18} />
            </div>
            <p className="text-2xl font-black text-white">{isLoading ? "—" : value}</p>
            <p className="text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-[#071428] p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent platform users</h2>
        <div className="space-y-3 text-sm text-white/60">
          {(stats?.recent_users ?? []).slice(0, 5).map((user: any) => (
            <div key={user.email} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#03091A] px-3 py-3">
              <div>
                <p className="font-semibold text-white">{user.name || user.email}</p>
                <p className="text-xs text-white/35">{user.email}</p>
              </div>
              <span className="font-semibold text-brand-300">{user.created_at ? new Date(user.created_at).toLocaleDateString() : "New"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
