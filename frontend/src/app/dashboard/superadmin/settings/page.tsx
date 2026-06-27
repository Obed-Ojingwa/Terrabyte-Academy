"use client";
import { Settings as SettingsIcon, ShieldCheck, BellRing } from "lucide-react";

const settingsCards = [
  { title: "Security", description: "Review authentication, password, and access policies.", icon: ShieldCheck },
  { title: "Notifications", description: "Control alerts for enrollments, certificates, and support tickets.", icon: BellRing },
];

export default function SuperAdminSettingsPage() {
  return (
    <div className="min-h-full bg-[#03091A] p-6">
      <h1 className="mb-1 text-2xl font-black text-white">Platform Settings</h1>
      <p className="mb-8 text-sm text-white/40">Adjust system preferences and operational controls.</p>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsCards.map(({ title, description, icon: Icon }) => (
          <div key={title} className="rounded-2xl border border-white/[0.06] bg-[#071428] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
              <Icon size={18} />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-white/40">{description}</p>
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
            <p className="text-sm text-white/40">All platform controls are currently active.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
