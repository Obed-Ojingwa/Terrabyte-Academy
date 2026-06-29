"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Users, BarChart3 } from "lucide-react";
import { StudentProgressResponse } from "@/types/course";

export default function AdminStudentProgressPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/users")).data,
  });

  const studentProgressQuery = useQuery<StudentProgressResponse>({
    queryKey: ["admin-student-progress", selectedUserId],
    queryFn: async () => (await api.get(`/admin/students/${selectedUserId}/progress`)).data,
    enabled: !!selectedUserId,
    onError: () => {
      // intentionally silent; page displays fallback text
    },
  });

  const users = useMemo(() => (data?.items ?? []).filter((user: any) => user.role?.name === "student"), [data]);
  const selectedUser = useMemo(() => users.find((user: any) => user.id === selectedUserId) ?? null, [users, selectedUserId]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black">Student progress</h1>
          <p className="mt-1 text-sm text-slate-500">Review each student’s course progress from a dedicated admin panel.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{users.length}</span> students
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Student roster</h2>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading students...</p>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${selectedUserId === user.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-950">{user.first_name} {user.last_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Student</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Progress detail</h2>
          </div>
          {!selectedUserId ? (
            <p className="text-sm text-slate-500">Select a student on the left to view detailed progress data.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{selectedUser?.first_name} {selectedUser?.last_name}</div>
                    <div className="mt-1 text-sm text-slate-600">{selectedUser?.email}</div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Student</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">Course progress</h3>
                    <p className="text-xs text-slate-500">Fetched from admin progress API</p>
                  </div>
                  <button
                    onClick={() => studentProgressQuery.refetch()}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Refresh
                  </button>
                </div>
                {studentProgressQuery.isLoading ? (
                  <p className="mt-3 text-sm text-slate-500">Loading progress...</p>
                ) : studentProgressQuery.data?.progress?.length ? (
                  <div className="space-y-3 mt-4">
                    {studentProgressQuery.data.progress.map((item) => (
                      <div key={item.course_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-950">{item.course_title}</div>
                            <div className="mt-1 text-xs text-slate-500">{item.enrollment_status}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-950">{item.progress_percent}%</div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{item.lessons_completed}/{item.total_lessons} lessons completed</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No course progress records found for this student.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
