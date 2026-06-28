"use client";
import { useAuthStore } from "@/store/authStore";
export default function TutorDashboard() {
  const { user } = useAuthStore();
  return (
    <div className="p-6 page-light min-h-full text-slate-950">
      <h1 className="text-2xl font-black text-slate-950 mb-1">Tutor Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Welcome, {user?.first_name}. Manage your courses and students here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{icon:"📚",label:"My Courses",value:"3"},{icon:"📝",label:"Pending Submissions",value:"12"},{icon:"👥",label:"Total Students",value:"87"}].map(item=>(
          <div key={item.label} className="page-surface rounded-2xl p-6 shadow-sm">
            <div className="text-3xl mb-3">{item.icon}</div>
            <p className="text-2xl font-black text-slate-950">{item.value}</p>
            <p className="text-slate-500 text-sm mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
