"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import StatCard from "@/components/dashboard/StatCard";
import { BookOpen, CheckCircle, Trophy, Award } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ["student-stats"], queryFn: async () => (await api.get("/analytics/student/stats")).data });
  const { data: enrollments } = useQuery({ queryKey: ["my-enrollments"], queryFn: async () => (await api.get("/enrollments/me")).data });

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
      <div>
        <h2 className="font-bold text-white text-sm mb-4">Active Courses</h2>
        <div className="space-y-3">
          {enrollments?.items?.map((e: any) => (
            <div key={e.id} className="bg-[#071428] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-700/20 flex items-center justify-center flex-shrink-0"><BookOpen size={20} className="text-brand-400"/></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{e.course?.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden"><div className="bg-brand-400 h-full rounded-full transition-all" style={{width:`${e.progress ?? 0}%`}}/></div>
                  <span className="text-xs text-white/40">{e.progress ?? 0}%</span>
                </div>
              </div>
              <button className="text-xs bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/20 px-3 py-2 rounded-xl transition-all flex-shrink-0">Continue</button>
            </div>
          ))}
          {!enrollments?.items?.length && <p className="text-white/30 text-sm text-center py-8">No enrolled courses yet. <a href="/public/courses" className="text-brand-400 hover:underline">Browse courses →</a></p>}
        </div>
      </div>
    </div>
  );
}
