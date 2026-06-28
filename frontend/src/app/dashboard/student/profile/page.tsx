"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Phone, Calendar } from "lucide-react";

export default function StudentProfilePage() {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["student-profile"], queryFn: async () => (await api.get("/users/me")).data });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setPhone(profile.phone || "");
    setAvatarUrl(profile.avatar_url || "");
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { first_name: string; last_name: string; phone?: string; avatar_url?: string }) => (await api.patch("/users/me", payload)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(["student-profile"], data);
      updateUser(data);
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Unable to update profile"),
  });

  const details = useMemo(
    () => [
      { label: "Email", value: profile?.email ?? "Not set", icon: Mail },
      { label: "Phone", value: profile?.phone || "Not set", icon: Phone },
      { label: "Joined", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown", icon: Calendar },
    ],
    [profile]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateMutation.mutateAsync({ first_name: firstName, last_name: lastName, phone: phone || undefined, avatar_url: avatarUrl || undefined });
  };

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
              <div className="mt-1 text-sm text-slate-500">{profile?.role?.name || "Student"}</div>
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

        <form onSubmit={onSubmit} className="page-surface rounded-3xl p-5 shadow-sm space-y-6">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <User size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Edit profile</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">First name</span>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Last name</span>
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Avatar URL</span>
              <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </label>
          </div>

          <button type="submit" disabled={updateMutation.isLoading} className="inline-flex items-center justify-center rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300">
            {updateMutation.isLoading ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
