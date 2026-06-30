"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/ui/BrandLogo";
import { LayoutDashboard, BookOpen, FileText, Trophy, Award, Users, CreditCard, Settings, LogOut, BarChart2, BarChart3, Upload, CheckSquare, Newspaper, Calendar, User } from "lucide-react";

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

  const handleLogout = () => { logout(); router.push("/auth/login"); };

  return (
    <aside className="w-64 bg-[#020a16] flex flex-col h-full shrink-0 border-r border-white/[0.05]">
      <div className="p-5 border-b border-white/[0.05]">
        <BrandLogo />
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] text-white/25 px-3 py-2 uppercase tracking-[0.12em] font-semibold mb-1">{role.replace("_", " ")}</p>
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href + label} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all", active ? "bg-brand-500/20 text-brand-300 font-semibold" : "text-white/50 hover:bg-white/[0.05] hover:text-white")}>
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/70 transition-colors w-full px-3 py-2 rounded-xl hover:bg-white/[0.05]">
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
