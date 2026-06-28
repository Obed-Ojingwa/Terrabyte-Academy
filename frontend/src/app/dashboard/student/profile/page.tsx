"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";

export default function StudentProfilePage() {
  const { data: profile } = useQuery({ queryKey: ["student-profile"], queryFn: async () => (await api.get("/users/me")).data });

  const details = useMemo(() => [
    { label: "Email", value: profile?.email, icon: Mail },
    { label: "Phone", value: profile?.phone || "Not set", icon: Phone },
    { label: "Joined", value: profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString() : "Unknown", icon: Calendar },
    { label: "Location", value: profile?.location || "Not set", icon: MapPin },
  ], [profile]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your student profile, contact details, and account info.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500 text-white text-2xl font-black">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</div>
            <div>
              <div className="text-lg font-semibold text-slate-950">{profile?.first_name} {profile?.last_name}</div>
              <div className="mt-1 text-sm text-slate-500">{profile?.role ?? "Student"}</div>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {details.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-slate-900">
                    <Icon size={18} className="text-brand-500" />
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.value}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <User size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Account details</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">Email</div>
              <div className="mt-2 text-sm text-slate-700">{profile?.email}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">Role</div>
              <div className="mt-2 text-sm text-slate-700">{profile?.role ?? "Student"}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">Member since</div>
              <div className="mt-2 text-sm text-slate-700">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
