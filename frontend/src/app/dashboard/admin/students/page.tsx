"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { Users, ShieldCheck, Ban } from "lucide-react";

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await api.get("/users")).data });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, isActive, roleName }: { userId: string; isActive?: boolean; roleName?: string }) => {
      const payload: Record<string, unknown> = {};
      if (typeof isActive === "boolean") payload.is_active = isActive;
      if (roleName) payload.role_name = roleName;
      return api.patch(`/users/${userId}`, payload);
    },
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Unable to update user"),
  });

  const users = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Student management</h1>
          <p className="mt-1 text-sm text-slate-500">Review accounts and toggle active status.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{users.length}</span> users
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Accounts</h2>
          </div>
          {isLoading ? <p className="text-sm text-slate-500">Loading users...</p> : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <button key={user.id} onClick={() => setSelectedUserId(user.id)} className={`w-full rounded-2xl border p-3 text-left ${selectedUserId === user.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-950">{user.first_name} {user.last_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${user.is_active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                      {user.is_active ? "Active" : "Blocked"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">User details</h2>
          </div>
          {!selectedUserId ? <p className="text-sm text-slate-500">Select an account to manage it.</p> : (
            <div className="space-y-4">
              {(() => {
                const user = users.find((item: any) => item.id === selectedUserId);
                if (!user) return null;
                return (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-950">{user.first_name} {user.last_name}</div>
                    <div className="mt-1 text-sm text-slate-600">{user.email}</div>
                    <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">Role: {user.role?.name || "student"}</div>
                    <label className="mt-3 block text-sm text-slate-600">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assign role</span>
                      <select
                        value={user.role?.name || "student"}
                        onChange={(event) => updateMutation.mutate({ userId: user.id, roleName: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"
                      >
                        <option value="student">Student</option>
                        <option value="tutor">Tutor</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </label>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => updateMutation.mutate({ userId: user.id, isActive: !user.is_active })} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white ${user.is_active ? "bg-red-600" : "bg-green-600"}`}>
                        <Ban size={15} /> {user.is_active ? "Block account" : "Unblock account"}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
