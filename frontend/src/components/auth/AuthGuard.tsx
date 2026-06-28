"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface Props { children: React.ReactNode; allowedRoles?: string[]; }

export default function AuthGuard({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) { router.replace("/auth/login"); return; }
    if (allowedRoles && user && !allowedRoles.includes(user.role.name)) router.replace("/unauthorized");
  }, [isAuthenticated, user, allowedRoles, router]);
  if (!isAuthenticated) return <div className="min-h-screen page-light flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-300/50 border-t-brand-400 rounded-full animate-spin" /></div>;
  return <>{children}</>;
}
