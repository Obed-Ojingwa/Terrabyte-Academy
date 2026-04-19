import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props { label: string; value: number | string; icon: ReactNode; color?: "blue"|"green"|"yellow"|"purple"|"red"; change?: number; }

const colorMap = { blue: "bg-blue-500/10 text-blue-400", green: "bg-green-500/10 text-green-400", yellow: "bg-yellow-500/10 text-yellow-400", purple: "bg-purple-500/10 text-purple-400", red: "bg-red-500/10 text-red-400" };

export default function StatCard({ label, value, icon, color = "blue", change }: Props) {
  return (
    <div className="bg-[#071428] border border-brand-500/15 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl", colorMap[color])}>{icon}</div>
        {change !== undefined && <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", change >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>{change >= 0 ? "+" : ""}{change}%</span>}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}
