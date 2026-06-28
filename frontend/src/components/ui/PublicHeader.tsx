"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/ui/BrandLogo";

const navLinks = [
  { label: "Courses", href: "/public/courses" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/public/blog" },
  { label: "Events", href: "/public/events" },
  { label: "Contact", href: "/contact" },
];

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("resize", closeMenu);
    return () => window.removeEventListener("resize", closeMenu);
  }, []);

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

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200">
            Get Started
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-1">
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
          <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
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
        </div>
      </div>
    </nav>
  );
}
