"use client";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";
import Sidebar from "@/components/ui/Sidebar";

const roleRouteMap: Record<string, RegExp[]> = {
  student: [/^\/dashboard\/student(\/|$)/],
  tutor: [/^\/dashboard\/tutor(\/|$)/],
  admin: [/^\/dashboard\/admin(\/|$)/],
  super_admin: [/^\/dashboard\/superadmin(\/|$)/],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    let isMounted = true;
    const verifySession = async () => {
      try {
        await api.get("/users/me");
      } catch {
        if (!isMounted) return;
        logout();
        router.replace("/auth/login");
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, [isAuthenticated, logout, router]);

  if (!isAuthenticated) return <div className="min-h-screen page-light flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-300/30 border-t-brand-400 rounded-full animate-spin" /></div>;

  const role = user?.role?.name || "student";
  const allowed = roleRouteMap[role]?.some((pattern) => pattern.test(pathname)) ?? false;
  if (!allowed) {
    return <div className="min-h-screen page-light flex items-center justify-center px-6 text-center"><div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><h1 className="text-xl font-black text-slate-950">Access restricted</h1><p className="mt-2 text-sm text-slate-500">This area is not available for your current role.</p></div></div>;
  }

  return (
    <div className="flex h-screen page-light overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
