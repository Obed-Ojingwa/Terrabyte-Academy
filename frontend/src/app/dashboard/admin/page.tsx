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
  const revenueSeries = stats?.revenue_series ?? [];
  const activityItems = stats?.recent_activity ?? [];
  return (
    <div className="p-6 space-y-6 page-light min-h-full text-slate-950">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-slate-950 tracking-tight">Admin Dashboard</h1><p className="text-slate-600 text-sm mt-1">Platform overview — {new Date().toLocaleDateString("en-NG",{month:"long",year:"numeric"})}</p></div>
        <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"><BookOpen size={15}/> New Course</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats?.total_students ?? 0} icon={<Users size={16}/>} color="blue" change={12}/>
        <StatCard label="Active Courses" value={stats?.total_courses ?? 0} icon={<BookOpen size={16}/>} color="green" change={5}/>
        <StatCard label="Revenue" value={`₦${((stats?.total_revenue ?? 0)/1000000).toFixed(1)}M`} icon={<CreditCard size={16}/>} color="yellow" change={18}/>
        <StatCard label="Certs Issued" value={stats?.certificates_issued ?? 0} icon={<Award size={16}/>} color="purple" change={9}/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="page-surface rounded-2xl p-6">
          <h2 className="font-bold text-slate-950 text-sm mb-4">Live operations</h2>
          <div className="space-y-3">
            {activityItems.map((item:any) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-semibold text-brand-600">{item.value} · {item.trend}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="page-surface rounded-2xl p-6">
          <h2 className="font-bold text-slate-950 text-sm mb-4">Revenue momentum</h2>
          <div className="space-y-2">
            {revenueSeries.map((item:any) => (
              <div key={item.month} className="flex items-center justify-between text-sm text-slate-700">
                <span>{item.month}</span>
                <span className="font-semibold text-slate-950">₦{(item.value / 1000000).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 page-surface rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6"><h2 className="font-bold text-slate-950 text-sm">Revenue Overview</h2><span className="text-xs text-slate-500">Last 6 months</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} barSize={28}>
              <XAxis dataKey="month" tick={{fill:"#475569",fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#ffffff",border:"0.5px solid rgba(148,163,184,0.3)",borderRadius:8,fontSize:11}} formatter={(v:number)=>[`₦${(v/1000000).toFixed(2)}M`,`Revenue`]} labelStyle={{color:"#475569"}} cursor={{fill:"rgba(15,23,42,0.04)"}}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{revenueData.map((_,i)=><Cell key={i} fill={i===revenueData.length-1?"#2389ff":`rgba(35,137,255,${0.3+i*0.12})`}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="page-surface rounded-2xl p-6">
          <h2 className="font-bold text-slate-950 text-sm mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[["📚","Create Course"],["👤","Add Student"],["💳","View Payments"],["🎓","Approve Certificate"],["📝","Write Blog Post"],["📅","Create Event"]].map(([icon,label])=>(
              <button key={label} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-left"><span className="text-base">{icon}</span><span className="text-sm text-slate-700">{label}</span></button>
            ))}
          </div>
        </div>
      </div>
      <div className="page-surface rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between"><h2 className="font-bold text-slate-950 text-sm">Recent Registrations</h2><button className="text-xs text-brand-600 hover:text-brand-500">View all →</button></div>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-500 text-xs uppercase tracking-wider"><th className="text-left px-5 py-3 font-medium">Student</th><th className="text-left px-5 py-3 font-medium">Course</th><th className="text-left px-5 py-3 font-medium">Mode</th><th className="text-left px-5 py-3 font-medium">Amount</th><th className="text-left px-5 py-3 font-medium">Status</th></tr></thead>
          <tbody>
            {[{name:"Emeka Nwosu",course:"GIS",mode:"Online",amount:"₦75,000",status:"Active"},{name:"Fatima Bello",course:"Data Analysis",mode:"Physical",amount:"₦85,000",status:"Pending"},{name:"Chukwudi Eze",course:"Remote Sensing",mode:"Online",amount:"₦95,000",status:"Active"},{name:"Ngozi Adeleke",course:"Surveying",mode:"Private",amount:"₦120,000",status:"Active"}].map((row,i)=>(
              <tr key={i} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-slate-950 font-medium">{row.name}</td>
                <td className="px-5 py-4 text-slate-700">{row.course}</td>
                <td className="px-5 py-4 text-slate-700">{row.mode}</td>
                <td className="px-5 py-4 text-slate-950">{row.amount}</td>
                <td className="px-5 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.status==="Active"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
