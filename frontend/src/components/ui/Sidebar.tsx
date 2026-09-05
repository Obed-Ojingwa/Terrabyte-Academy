"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/ui/BrandLogo";
import { LayoutDashboard, BookOpen, FileText, Trophy, Award, Users, CreditCard, Settings, LogOut, BarChart2, BarChart3, CheckSquare, Newspaper, Calendar, User, Menu, X } from "lucide-react";


const navMap: Record<string, { label: string; icon: any; href: string }[]> = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/student" },
    { label: "My Courses", icon: BookOpen, href: "/dashboard/student/courses" },
    { label: "Learning", icon: BookOpen, href: "/dashboard/student/learning" },
    { label: "Assignments", icon: FileText, href: "/dashboard/student/assignments" },
    { label: "Exams", icon: Trophy, href: "/dashboard/student/exams" },
    { label: "Certificates", icon: Award, href: "/dashboard/student/certificates" },
    { label: "Forum", icon: Users, href: "/dashboard/student/forum" },
    { label: "Profile", icon: User, href: "/dashboard/student/profile" },
  ],
  tutor: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/tutor" },
    { label: "My Courses", icon: BookOpen, href: "/dashboard/tutor/courses" },
    { label: "Assignments", icon: FileText, href: "/dashboard/tutor/assignments" },
    { label: "Submissions", icon: CheckSquare, href: "/dashboard/tutor/submissions" },
  ],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/admin" },
    { label: "Courses", icon: BookOpen, href: "/dashboard/admin/courses" },
    { label: "Students", icon: Users, href: "/dashboard/admin/students" },
    { label: "Student progress", icon: BarChart3, href: "/dashboard/admin/students/progress" },
    { label: "Payments", icon: CreditCard, href: "/dashboard/admin/payments" },
    { label: "Certificates", icon: Award, href: "/dashboard/admin/certificates" },
    { label: "Content", icon: Newspaper, href: "/dashboard/admin/content" },
    { label: "Blog", icon: Newspaper, href: "/dashboard/admin/blog" },
    { label: "Events", icon: Calendar, href: "/dashboard/admin/events" },
  ],
  super_admin: [
    { label: "Overview", icon: BarChart2, href: "/dashboard/superadmin" },
    { label: "Admins", icon: Users, href: "/dashboard/superadmin/admins" },
    { label: "Analytics", icon: BarChart2, href: "/dashboard/superadmin/analytics" },
    { label: "Settings", icon: Settings, href: "/dashboard/superadmin/settings" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role.name || "student";
  const navItems = navMap[role] || navMap.student;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => { logout(); router.push("/auth/login"); };


  return (
    <>
      <button type="button" onClick={() => setMenuOpen(true)} className="fixed left-4 top-4 z-40 rounded-xl bg-slate-950 p-2.5 text-white shadow-lg md:hidden" aria-label="Open dashboard menu">
        <Menu size={20} />
      </button>
      <div className={`fixed inset-0 z-50 bg-slate-950/45 transition-opacity duration-300 md:hidden ${menuOpen ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setMenuOpen(false)} aria-hidden="true">
        <aside className={`h-full w-[min(19rem,86vw)] bg-[#0b1730] shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "-translate-x-full"}`} onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
            <BrandLogo />
            <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-white/70 hover:bg-white/[0.08] hover:text-white" aria-label="Close dashboard menu"><X size={20} /></button>
          </div>
          <SidebarContent navItems={navItems} pathname={pathname} role={role} user={user} onLogout={handleLogout} />
        </aside>
      </div>
      <aside className="hidden w-64 bg-[#0b1730] md:flex md:flex-col h-full shrink-0 border-r border-white/[0.05]">
      <div className="p-5 border-b border-white/[0.05]">
        <BrandLogo />
      </div>
        <SidebarContent navItems={navItems} pathname={pathname} role={role} user={user} onLogout={handleLogout} />
    </aside>
    </>
  );
}

function SidebarContent({ navItems, pathname, role, user, onLogout }: { navItems: { label: string; icon: any; href: string }[]; pathname: string; role: string; user: ReturnType<typeof useAuthStore.getState>["user"]; onLogout: () => void }) {
  return (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-white/35 px-3 py-2 uppercase tracking-[0.12em] font-semibold mb-1">{role.replace("_", " ")}</p>
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return <Link key={href + label} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all", active ? "bg-brand-500/20 text-brand-300 font-semibold" : "text-white/60 hover:bg-white/[0.05] hover:text-white")}><Icon size={15} className="flex-shrink-0" />{label}</Link>;
        })}
      </nav>
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p><p className="text-[10px] text-white/40 truncate">{user?.email}</p></div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors w-full px-3 py-2 rounded-xl hover:bg-white/[0.05]"><LogOut size={13} /> Sign out</button>
      </div>
    </>
  );
}
