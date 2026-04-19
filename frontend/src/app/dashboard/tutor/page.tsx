"use client";
import { useAuthStore } from "@/store/authStore";
export default function TutorDashboard() {
  const { user } = useAuthStore();
  return (
    <div className="p-6 bg-[#03091A] min-h-full">
      <h1 className="text-2xl font-black text-white mb-1">Tutor Dashboard</h1>
      <p className="text-white/40 text-sm mb-8">Welcome, {user?.first_name}. Manage your courses and students here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{icon:"📚",label:"My Courses",value:"3"},{icon:"📝",label:"Pending Submissions",value:"12"},{icon:"👥",label:"Total Students",value:"87"}].map(item=>(
          <div key={item.label} className="bg-[#071428] border border-white/[0.06] rounded-2xl p-6">
            <div className="text-3xl mb-3">{item.icon}</div>
            <p className="text-2xl font-black text-white">{item.value}</p>
            <p className="text-white/40 text-sm mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
