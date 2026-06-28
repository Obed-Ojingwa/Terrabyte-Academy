import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props { label: string; value: number | string; icon: ReactNode; color?: "blue"|"green"|"yellow"|"purple"|"red"; change?: number; }

const colorMap = { blue: "bg-blue-500/10 text-blue-600", green: "bg-emerald-500/10 text-emerald-600", yellow: "bg-amber-500/10 text-amber-600", purple: "bg-violet-500/10 text-violet-600", red: "bg-rose-500/10 text-rose-600" };

export default function StatCard({ label, value, icon, color = "blue", change }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl", colorMap[color])}>{icon}</div>
        {change !== undefined && <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", change >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{change >= 0 ? "+" : ""}{change}%</span>}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}
