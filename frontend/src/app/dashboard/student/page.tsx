"use client";
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import StatCard from "@/components/dashboard/StatCard";
import { BookOpen, CheckCircle, Trophy, Award, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentDashboard() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ["student-stats"], queryFn: async () => (await api.get("/analytics/student/stats")).data });
  const { data: enrollmentsData } = useQuery({ queryKey: ["my-enrollments"], queryFn: async () => (await api.get("/enrollments")).data });
  const { data: certificates = [] } = useQuery({ queryKey: ["student-certificates"], queryFn: async () => (await api.get("/certificates/me")).data });
  const nextSteps = stats?.next_up ?? [];

  const requestCertificateMutation = useMutation({
    mutationFn: async (courseId: string) => api.post("/certificates/request", null, { params: { course_id: courseId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student-certificates"] }); toast.success("Certificate request submitted"); },
    onError: () => toast.error("Unable to request certificate")
  });

  const enrollments = useMemo(() => enrollmentsData ?? [], [enrollmentsData]);

  return (
    <div className="p-6 space-y-8 bg-[#03091A] min-h-full">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white tracking-tight">Welcome back, {user?.first_name}!</h1><p className="text-white/40 text-sm mt-1">Here&apos;s your learning progress overview</p></div>
        <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold text-white">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled" value={stats?.enrolled ?? 0} icon={<BookOpen size={16}/>} color="blue" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={<CheckCircle size={16}/>} color="green" />
        <StatCard label="Assignments" value={stats?.assignments ?? 0} icon={<Trophy size={16}/>} color="yellow" />
        <StatCard label="Certificates" value={stats?.certificates ?? 0} icon={<Award size={16}/>} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-4">
        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <h2 className="font-bold text-white text-sm mb-4">Progress snapshot</h2>
          <div className="rounded-2xl border border-white/10 bg-[#03091A] p-4 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Completion rate</span>
              <span className="font-semibold text-brand-300">{stats?.completion_rate ?? 0}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand-400" style={{ width: `${stats?.completion_rate ?? 0}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <h2 className="font-bold text-white text-sm mb-4">Next steps</h2>
          <div className="space-y-2">
            {nextSteps.map((step:any) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-[#03091A] px-3 py-3 text-sm">
                <div className="font-semibold text-white">{step.title}</div>
                <div className="mt-1 text-xs text-white/40">{step.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-bold text-white text-sm mb-4">Active Courses</h2>
        <div className="space-y-3">
          {enrollments.map((e: any) => (
            <div key={e.id} className="bg-[#071428] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-700/20 flex items-center justify-center flex-shrink-0"><BookOpen size={20} className="text-brand-400"/></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{e.course?.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden"><div className="bg-brand-400 h-full rounded-full transition-all" style={{width:`${e.progress ?? 0}%`}}/></div>
                  <span className="text-xs text-white/40">{e.progress ?? 0}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/20 px-3 py-2 rounded-xl transition-all flex-shrink-0">Continue</button>
                <button onClick={() => requestCertificateMutation.mutate(e.course_id)} className="text-xs bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-3 py-2 rounded-xl transition-all flex-shrink-0">Request certificate</button>
              </div>
            </div>
          ))}
          {!enrollments.length && <p className="text-white/30 text-sm text-center py-8">No enrolled courses yet. <a href="/public/courses" className="text-brand-400 hover:underline">Browse courses →</a></p>}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Recent certificates</h2>
          <a href="/dashboard/student/certificates" className="text-sm text-brand-300">View all <ArrowRight size={14} className="inline" /></a>
        </div>
        <div className="mt-4 space-y-3">
          {certificates.slice(0, 3).map((certificate: any) => (
            <div key={certificate.id} className="rounded-2xl border border-white/10 bg-[#03091A] p-3 text-sm">
              <div className="font-semibold">{certificate.certificate_number}</div>
              <div className="mt-1 text-xs text-white/40">{certificate.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
