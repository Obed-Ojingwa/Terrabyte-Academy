"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { useLogout } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import type { UserRoleName } from "@/types/auth";

const navLinks = [
  { label: "Courses", href: "/public/courses" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/public/blog" },
  { label: "Events", href: "/public/events" },
  { label: "Contact", href: "/contact" },
];

const dashboardRoutes: Record<UserRoleName, string> = {
  super_admin: "/dashboard/superadmin",
  admin: "/dashboard/admin",
  tutor: "/dashboard/tutor",
  student: "/dashboard/student",
};

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const accountUser = hasMounted && isAuthenticated ? user : null;
  const dashboardHref = accountUser ? dashboardRoutes[accountUser.role.name] : "/dashboard/student";
  const learningHref = accountUser?.role.name === "student" ? "/dashboard/student/learning" : dashboardHref;
  const accountName = accountUser ? `${accountUser.first_name} ${accountUser.last_name}`.trim() : "";
  const initials = accountUser ? `${accountUser.first_name?.[0] ?? ""}${accountUser.last_name?.[0] ?? ""}` : "";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const closeMenus = () => {
      setMenuOpen(false);
      setProfileMenuOpen(false);
    };
    window.addEventListener("resize", closeMenus);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      window.removeEventListener("resize", closeMenus);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
    logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16">
        <BrandLogo className="flex-shrink-0" />

        <div className="hidden md:flex items-center gap-7 text-sm text-gray-500">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-600 transition-colors font-medium">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center justify-end gap-3 min-w-[12rem]">
          {accountUser ? (
            <>
              <Link
                href={learningHref}
                className="text-sm text-gray-700 hover:text-blue-600 font-semibold px-3 py-2 transition-colors"
              >
                {accountUser.role.name === "student" ? "My Learning" : "Dashboard"}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {initials || <UserRound size={15} />}
                  </span>
                  <span className="max-w-28 truncate">{accountUser.first_name}</span>
                  <ChevronDown size={15} className={`transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl" role="menu">
                    <div className="border-b border-gray-100 px-3 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{accountName}</p>
                      <p className="truncate text-xs text-gray-500">{accountUser.email}</p>
                    </div>
                    <Link
                      href={dashboardHref}
                      onClick={() => setProfileMenuOpen(false)}
                      className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      role="menuitem"
                    >
                      Dashboard
                    </Link>
                    {accountUser.role.name === "student" && (
                      <Link
                        href="/dashboard/student/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        role="menuitem"
                      >
                        Profile
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : hasMounted ? (
            <>
              <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium px-4 py-2 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200">
                Get Started
              </Link>
            </>
          ) : null}
        </div>

        <button
          className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        id="public-mobile-menu"
        className={`md:hidden fixed inset-0 top-16 z-40 transition-opacity duration-300 ${menuOpen ? "visible bg-slate-950/25 opacity-100" : "invisible opacity-0"}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute right-0 top-0 h-[calc(100dvh-4rem)] w-[min(22rem,88vw)] overflow-y-auto border-l border-gray-200 bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Explore</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="Close menu">
              <span className="text-xl leading-none">&times;</span>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {accountUser ? (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="mb-3 flex items-center gap-3 px-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {initials || <UserRound size={18} />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{accountName}</p>
                  <p className="truncate text-xs text-gray-500">{accountUser.email}</p>
                </div>
              </div>
              <Link
                href={learningHref}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                {accountUser.role.name === "student" ? "My Learning" : "Dashboard"}
              </Link>
              {accountUser.role.name === "student" && (
                <Link
                  href="/dashboard/student/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Profile
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          ) : hasMounted ? (
            <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center text-sm border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all"
              >
                Get Started
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
