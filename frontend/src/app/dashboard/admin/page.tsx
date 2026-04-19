"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import { Users, BookOpen, CreditCard, Award } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const revenueData = [
  {month:"Nov",value:820000},{month:"Dec",value:1200000},{month:"Jan",value:1650000},
  {month:"Feb",value:1900000},{month:"Mar",value:2100000},{month:"Apr",value:2400000},
];

export default function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await api.get("/analytics/admin")).data });
  return (
    <div className="p-6 space-y-6 bg-[#03091A] min-h-full">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-white tracking-tight">Admin Dashboard</h1><p className="text-white/40 text-sm mt-1">Platform overview — {new Date().toLocaleDateString("en-NG",{month:"long",year:"numeric"})}</p></div>
        <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"><BookOpen size={15}/> New Course</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats?.total_students ?? 0} icon={<Users size={16}/>} color="blue" change={12}/>
        <StatCard label="Active Courses" value={stats?.total_courses ?? 0} icon={<BookOpen size={16}/>} color="green" change={5}/>
        <StatCard label="Revenue" value={`₦${((stats?.total_revenue ?? 0)/1000000).toFixed(1)}M`} icon={<CreditCard size={16}/>} color="yellow" change={18}/>
        <StatCard label="Certs Issued" value={stats?.certificates_issued ?? 0} icon={<Award size={16}/>} color="purple" change={9}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#071428] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="font-bold text-white text-sm">Revenue Overview</h2><span className="text-xs text-white/30">Last 6 months</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="month" tick={{fill:"rgba(255,255,255,0.3)",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#071428",border:"0.5px solid rgba(55,138,221,0.3)",borderRadius:8,fontSize:11}} formatter={(v:number)=>[`₦${(v/1000000).toFixed(2)}M`,"Revenue"]} labelStyle={{color:"rgba(255,255,255,0.5)"}} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{revenueData.map((_,i)=><Cell key={i} fill={i===revenueData.length-1?"#378add":`rgba(55,138,221,${0.2+i*0.12})`}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#071428] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="font-bold text-white text-sm mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[["📚","Create Course"],["👤","Add Student"],["💳","View Payments"],["🎓","Approve Certificate"],["📝","Write Blog Post"],["📅","Create Event"]].map(([icon,label])=>(
              <button key={label} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"><span className="text-base">{icon}</span><span className="text-sm text-white/50 hover:text-white transition-colors">{label}</span></button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#071428] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.05] flex items-center justify-between"><h2 className="font-bold text-white text-sm">Recent Registrations</h2><button className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</button></div>
        <table className="w-full text-sm">
          <thead><tr className="text-white/30 text-xs uppercase tracking-wider"><th className="text-left px-5 py-3 font-medium">Student</th><th className="text-left px-5 py-3 font-medium">Course</th><th className="text-left px-5 py-3 font-medium">Mode</th><th className="text-left px-5 py-3 font-medium">Amount</th><th className="text-left px-5 py-3 font-medium">Status</th></tr></thead>
          <tbody>
            {[{name:"Emeka Nwosu",course:"Cybersecurity",mode:"Online",amount:"₦75,000",status:"Active"},{name:"Fatima Bello",course:"Data Analysis",mode:"Physical",amount:"₦85,000",status:"Pending"},{name:"Chukwudi Eze",course:"Web Dev",mode:"Online",amount:"₦95,000",status:"Active"},{name:"Ngozi Adeleke",course:"Cloud AWS",mode:"Private",amount:"₦120,000",status:"Active"}].map((row,i)=>(
              <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 text-white font-medium">{row.name}</td>
                <td className="px-5 py-4 text-white/50">{row.course}</td>
                <td className="px-5 py-4 text-white/50">{row.mode}</td>
                <td className="px-5 py-4 text-white">{row.amount}</td>
                <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.status==="Active"?"bg-green-500/10 text-green-400":"bg-yellow-500/10 text-yellow-400"}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
