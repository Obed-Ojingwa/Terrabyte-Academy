"use client";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/ui/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!isAuthenticated) router.replace("/auth/login"); }, [isAuthenticated, router]);
  if (!isAuthenticated) return <div className="min-h-screen bg-[#03091A] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/10 border-t-brand-400 rounded-full animate-spin" /></div>;
  return (
    <div className="flex h-screen bg-[#03091A] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
