// C:\Users\Melody\Documents\Terrabyte Academy\frontend\src\app\page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import BrandLogo from "@/components/ui/BrandLogo";
import academyLogo  from "./public/terrabyte_services_logo.png";

const heroSlides = [
  { id: 1, src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1400&q=80&auto=format&fit=crop", alt: "Developer coding" },
  { id: 2, src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&auto=format&fit=crop", alt: "Students collaborating" },
  { id: 3, src: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80&auto=format&fit=crop", alt: "Tech professional" },
];

const courses = [
  { title: "Cybersecurity Fundamentals", category: "Security", level: "Beginner", price: 75000, duration: "8 weeks", thumb: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&q=80&auto=format&fit=crop", levelColor: "bg-green-100 text-green-700", slug: "cybersecurity-fundamentals" },
  { title: "Data Analysis with Python", category: "Data Science", level: "Intermediate", price: 85000, duration: "10 weeks", thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop", levelColor: "bg-amber-100 text-amber-700", slug: "data-analysis-python" },
  { title: "Cloud Architecture (AWS)", category: "Cloud", level: "Advanced", price: 120000, duration: "12 weeks", thumb: "https://images.unsplash.com/photo-1667984390527-850f63192709?w=600&q=80&auto=format&fit=crop", levelColor: "bg-red-100 text-red-700", slug: "cloud-architecture-aws" },
  { title: "Full-Stack Web Development", category: "Development", level: "Intermediate", price: 95000, duration: "16 weeks", thumb: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80&auto=format&fit=crop", levelColor: "bg-amber-100 text-amber-700", slug: "fullstack-web-development" },
  { title: "UI/UX Design Mastery", category: "Design", level: "Beginner", price: 65000, duration: "8 weeks", thumb: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format&fit=crop", levelColor: "bg-green-100 text-green-700", slug: "uiux-design-mastery" },
  { title: "Network Administration", category: "Networking", level: "Intermediate", price: 80000, duration: "10 weeks", thumb: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80&auto=format&fit=crop", levelColor: "bg-amber-100 text-amber-700", slug: "network-administration" },
];

const testimonials = [
  { name: "Adaeze Okonkwo", role: "Cybersecurity Analyst, Access Bank", quote: "Terrabyte Academy completely changed my career. The instructors bring real industry experience, and the hands-on projects prepared me from day one. I was employed within six months.", avatar: "AO", course: "Cybersecurity Fundamentals", avatarBg: "bg-blue-600" },
  { name: "Emeka Nwosu", role: "Data Engineer, Flutterwave", quote: "Every module was immediately applicable at work. No fluff, just real skills. I landed my dream job at Flutterwave three months after graduating. Best decision I ever made.", avatar: "EN", course: "Data Analysis with Python", avatarBg: "bg-emerald-600" },
  { name: "Fatima Bello", role: "Cloud Architect, Microsoft", quote: "The AWS course was incredibly thorough. My certificate opened doors I did not even know existed. The support team checked in on me throughout and after the programme.", avatar: "FB", course: "Cloud Architecture (AWS)", avatarBg: "bg-amber-600" },
  { name: "Chukwudi Eze", role: "Senior Frontend Developer, Interswitch", quote: "I tried other platforms before but nothing matched the quality here. The instructors respond quickly, the student community is genuinely helpful, and the projects are the right kind of challenging.", avatar: "CE", course: "Full-Stack Web Development", avatarBg: "bg-purple-600" },
];

const stats = [
  { value: "2,400+", label: "Students Trained" },
  { value: "48", label: "Courses Offered" },
  { value: "96%", label: "Completion Rate" },
  { value: "100%", label: "Job-Ready Graduates" },
];

const navLinks = [
  { label: "Courses", href: "/public/courses" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/public/blog" },
  { label: "Events", href: "/public/events" },
  { label: "Contact", href: "/contact" },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [going, setGoing] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    if (going || idx === current) return;
    setGoing(true);
    setCurrent(idx);
    setTimeout(() => setGoing(false), 900);
  };
  const next = () => goTo((current + 1) % heroSlides.length);

  useEffect(() => {
    timer.current = setInterval(next, 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [current, going]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {heroSlides.map((slide, i) => (
        <div key={slide.id} className="absolute inset-0" style={{ opacity: i === current ? 1 : 0, transition: "opacity 900ms ease-in-out", zIndex: i === current ? 2 : 1 }}>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.src})`, transform: i === current ? "scale(1.04)" : "scale(1)", transition: "transform 5200ms ease-out" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {heroSlides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}>
            <div className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`} />
          </button>
        ))}
      </div>
      <button onClick={() => goTo((current - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white text-xl flex items-center justify-center transition-all">‹</button>
      <button onClick={next} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white text-xl flex items-center justify-center transition-all">›</button>
    </div>
  );
}

function CourseCard({ course }: { course: typeof courses[0] }) {
  return (
    <Link href={`/public/courses/${course.slug}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="relative h-44 overflow-hidden bg-gray-100">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${course.thumb})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3"><span className="text-[10px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15 uppercase tracking-wide">{course.category}</span></div>
          <div className="absolute top-3 right-3"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${course.levelColor}`}>{course.level}</span></div>
        </div>
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Certificate included
            </span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div><p className="text-[10px] text-gray-400 mb-0.5">Course fee</p><p className="font-bold text-gray-900 text-base">₦{course.price.toLocaleString()}</p></div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">Enroll now</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [testIdx, setTestIdx] = useState(0);
  const totalPages = Math.ceil(testimonials.length / 2);
  const visibleTests = testimonials.slice(testIdx * 2, testIdx * 2 + 2);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <div className="bg-white text-gray-900 min-h-screen font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16">

          {/* ── HEADER LOGO ── */}
          <BrandLogo className="flex-shrink-0" />

          <div className="hidden md:flex items-center gap-7 text-sm text-gray-500">
            {navLinks.map((l) => (<Link key={l.href} href={l.href} className="hover:text-blue-600 transition-colors font-medium">{l.label}</Link>))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium px-4 py-2 transition-colors">Sign In</Link>
            <Link href="/auth/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200">Get Started</Link>
          </div>
          <button className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (<Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">{l.label}</Link>))}
            <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all">Sign In</Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden">
        <HeroSlider />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full mb-7 backdrop-blur-sm tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
              Nigeria's Premier Technology Academy
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5 drop-shadow-lg">
              Learn Skills That<br /><span className="text-blue-300">Actually Matter</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
              Practical, industry-focused tech training for professionals in Nigeria. We teach cybersecurity, cloud computing, data science, and more — skills employers are actively looking for.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/public/courses" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-blue-900/40">
                Browse All Courses
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all backdrop-blur-sm">About Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s) => (<div key={s.label} className="text-center"><p className="text-3xl md:text-4xl font-black text-white">{s.value}</p><p className="text-sm text-blue-200 mt-1">{s.label}</p></div>))}
        </div>
      </section>

      {/* ── COURSES ── */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
            <div>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">What We Offer</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">Featured Courses</h2>
              <p className="text-gray-500 text-sm mt-2 max-w-md leading-relaxed">Professionally designed programmes taught by engineers and industry leaders with real working experience.</p>
            </div>
            <Link href="/public/courses" className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all">
              View all courses
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (<CourseCard key={c.slug} course={c} />))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">How It Works</h2>
            <p className="text-gray-500 text-sm mt-2">Four steps from sign-up to career transformation</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: "01", icon: "🔍", title: "Choose a Course", desc: "Browse our catalogue and pick the programme that fits your goals and current skill level." },
              { num: "02", icon: "🎯", title: "Pick a Mode", desc: "Learn online at your own pace, attend our Lagos campus on weekends, or book private sessions." },
              { num: "03", icon: "💳", title: "Pay Securely", desc: "Complete payment via Paystack in seconds. Your full course access is unlocked immediately." },
              { num: "04", icon: "🎓", title: "Earn Your Certificate", desc: "Complete all modules, pass assessments, and receive your verified digital certificate." },
            ].map((item) => (
              <div key={item.num} className="relative bg-gray-50 border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                <div className="absolute top-4 right-5 text-5xl font-black text-gray-100 select-none leading-none">{item.num}</div>
                <div className="text-3xl mb-5">{item.icon}</div>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1.5">{item.num}</p>
                <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Student Stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">What Our Alumni Say</h2>
            <p className="text-gray-500 text-sm mt-2">Real outcomes from real students across Nigeria</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleTests.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-5">{[...Array(5)].map((_,i)=>(<svg key={i} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>))}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mb-5"><span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">{t.course}</span></div>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>{t.avatar}</div>
                  <div><p className="font-semibold text-gray-900 text-sm">{t.name}</p><p className="text-gray-400 text-xs">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={()=>setTestIdx((p)=>(p-1+totalPages)%totalPages)} className="w-9 h-9 rounded-full border border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all text-lg">‹</button>
            {[...Array(totalPages)].map((_,i)=>(<button key={i} onClick={()=>setTestIdx(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i===testIdx?"w-8 bg-blue-600":"w-2 bg-gray-200 hover:bg-gray-300"}`}/>))}
            <button onClick={()=>setTestIdx((p)=>(p+1)%totalPages)} className="w-9 h-9 rounded-full border border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all text-lg">›</button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 px-6 md:px-12 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">Start Today</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">Ready to transform your career?</h2>
          <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg mx-auto">Join thousands of professionals across Nigeria who have built real, in-demand tech skills with Terrabyte Academy.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-700 font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg">Enroll Now — It is Simple →</Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-2xl text-sm transition-all">Talk to Us First</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-blue-200 text-gray-800 px-6 md:px-12 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            <div className="sm:col-span-2 lg:col-span-1">

              {/* ── FOOTER LOGO ── */}
              <Link href="/" className="flex items-center gap-3 mb-5">
                <Image
                  src={academyLogo}
                  alt="Terrabyte Academy"
                  height={48}
                  className="w-auto h-10 sm:h-12 md:h-14 object-contain shrink-0"
                />
                <div className="leading-tight">
                  <div className="font-black text-white text-sm sm:text-base"></div>
                  <div className="text-blue-400 font-bold text-[10px] sm:text-[11px] tracking-wider"></div>
                </div>
              </Link>

              <p className="text-gray-400 text-sm leading-relaxed mb-5">Nigeria's premier technology learning platform, building career-ready professionals through practical, industry-focused training.</p>
              <p className="text-gray-500 text-xs mb-4">RC: 1234567 · Lagos, Nigeria</p>
              <div className="flex gap-2 flex-wrap">
                {[{label:"WhatsApp",href:"https://wa.me/234XXXXXXXXXX"},{label:"LinkedIn",href:"#"},{label:"Twitter",href:"#"},{label:"Instagram",href:"#"}].map((s)=>(
                  <a key={s.label} href={s.href} className="text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/25 px-3 py-1.5 rounded-lg transition-all">{s.label}</a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Popular Courses</p>
              <div className="flex flex-col gap-3">
                {[
                  {label:"Cybersecurity Fundamentals",href:"/public/courses/cybersecurity-fundamentals"},
                  {label:"Data Analysis with Python",href:"/public/courses/data-analysis-python"},
                  {label:"Cloud Architecture (AWS)",href:"/public/courses/cloud-architecture-aws"},
                  {label:"Full-Stack Web Development",href:"/public/courses/fullstack-web-development"},
                  {label:"UI/UX Design Mastery",href:"/public/courses/uiux-design-mastery"},
                  {label:"Network Administration",href:"/public/courses/network-administration"},
                ].map((l)=>(<Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors leading-snug">{l.label}</Link>))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Quick Links</p>
              <div className="flex flex-col gap-3">
                {[
                  {label:"All Courses",href:"/public/courses"},
                  {label:"About Us",href:"/about"},
                  {label:"Blog & News",href:"/public/blog"},
                  {label:"Upcoming Events",href:"/public/events"},
                  {label:"Contact Us",href:"/contact"},
                  {label:"Verify Certificate",href:"/public/verify-certificate"},
                  {label:"Student Login",href:"/auth/login"},
                  {label:"Create Account",href:"/auth/register"},
                ].map((l)=>(<Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</Link>))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Contact Us</p>
              <div className="flex flex-col gap-4">
                <a href="mailto:hello@terrabyteacademy.com" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                  hello@terrabyteacademy.com
                </a>
                <a href="https://wa.me/234XXXXXXXXXX" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                  +234 800 000 0000
                </a>
                <span className="flex items-start gap-3 text-sm text-gray-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                  Victoria Island, Lagos, Nigeria
                </span>
                <span className="flex items-start gap-3 text-sm text-gray-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>
                  Mon–Fri, 9am – 6pm WAT
                </span>
                <a href="https://wa.me/234XXXXXXXXXX" className="mt-1 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all w-fit">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center sm:text-left">© {new Date().getFullYear()} Terrabyte Academy. RC: 1234567. All rights reserved.</p>
            <div className="flex gap-5">
              {["Privacy Policy","Terms of Service","Cookie Policy"].map((l)=>(<a key={l} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a>))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// // C:\Users\Melody\Documents\Terrabyte Academy\frontend\src\app\page.tsx
// "use client";

// import Link from "next/link";
// import { useState, useEffect, useRef } from "react";

// const heroSlides = [
//   { id: 1, src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1400&q=80&auto=format&fit=crop", alt: "Developer coding" },
//   { id: 2, src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&auto=format&fit=crop", alt: "Students collaborating" },
//   { id: 3, src: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80&auto=format&fit=crop", alt: "Tech professional" },
// ];

// const courses = [
//   { title: "Cybersecurity Fundamentals", category: "Security", level: "Beginner", price: 75000, duration: "8 weeks", thumb: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&q=80&auto=format&fit=crop", emoji: "🔐", levelColor: "bg-green-100 text-green-700", slug: "cybersecurity-fundamentals" },
//   { title: "Data Analysis with Python", category: "Data Science", level: "Intermediate", price: 85000, duration: "10 weeks", thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop", emoji: "📊", levelColor: "bg-amber-100 text-amber-700", slug: "data-analysis-python" },
//   { title: "Cloud Architecture (AWS)", category: "Cloud", level: "Advanced", price: 120000, duration: "12 weeks", thumb: "https://images.unsplash.com/photo-1667984390527-850f63192709?w=600&q=80&auto=format&fit=crop", emoji: "☁️", levelColor: "bg-red-100 text-red-700", slug: "cloud-architecture-aws" },
//   { title: "Full-Stack Web Development", category: "Development", level: "Intermediate", price: 95000, duration: "16 weeks", thumb: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80&auto=format&fit=crop", emoji: "💻", levelColor: "bg-amber-100 text-amber-700", slug: "fullstack-web-development" },
//   { title: "UI/UX Design Mastery", category: "Design", level: "Beginner", price: 65000, duration: "8 weeks", thumb: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format&fit=crop", emoji: "🎨", levelColor: "bg-green-100 text-green-700", slug: "uiux-design-mastery" },
//   { title: "Network Administration", category: "Networking", level: "Intermediate", price: 80000, duration: "10 weeks", thumb: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80&auto=format&fit=crop", emoji: "🌐", levelColor: "bg-amber-100 text-amber-700", slug: "network-administration" },
// ];

// const testimonials = [
//   { name: "Adaeze Okonkwo", role: "Cybersecurity Analyst, Access Bank", quote: "Terrabyte Academy completely changed my career. The instructors bring real industry experience, and the hands-on projects prepared me from day one. I was employed within six months.", avatar: "AO", course: "Cybersecurity Fundamentals", avatarBg: "bg-blue-600" },
//   { name: "Emeka Nwosu", role: "Data Engineer, Flutterwave", quote: "Every module was immediately applicable at work. No fluff, just real skills. I landed my dream job at Flutterwave three months after graduating. Best decision I ever made.", avatar: "EN", course: "Data Analysis with Python", avatarBg: "bg-emerald-600" },
//   { name: "Fatima Bello", role: "Cloud Architect, Microsoft", quote: "The AWS course was incredibly thorough. My certificate opened doors I did not even know existed. The support team checked in on me throughout and after the programme.", avatar: "FB", course: "Cloud Architecture (AWS)", avatarBg: "bg-amber-600" },
//   { name: "Chukwudi Eze", role: "Senior Frontend Developer, Interswitch", quote: "I tried other platforms before but nothing matched the quality here. The instructors respond quickly, the student community is genuinely helpful, and the projects are the right kind of challenging.", avatar: "CE", course: "Full-Stack Web Development", avatarBg: "bg-purple-600" },
// ];

// const stats = [
//   { value: "2,400+", label: "Students Trained" },
//   { value: "48", label: "Courses Offered" },
//   { value: "96%", label: "Completion Rate" },
//   { value: "100%", label: "Job-Ready Graduates" },
// ];

// const navLinks = [
//   { label: "Courses", href: "/public/courses" },
//   { label: "About Us", href: "/about" },
//   { label: "Blog", href: "/public/blog" },
//   { label: "Events", href: "/public/events" },
//   { label: "Contact", href: "/contact" },
// ];

// function HeroSlider() {
//   const [current, setCurrent] = useState(0);
//   const [going, setGoing] = useState(false);
//   const timer = useRef<ReturnType<typeof setInterval> | null>(null);

//   const goTo = (idx: number) => {
//     if (going || idx === current) return;
//     setGoing(true);
//     setCurrent(idx);
//     setTimeout(() => setGoing(false), 900);
//   };
//   const next = () => goTo((current + 1) % heroSlides.length);

//   useEffect(() => {
//     timer.current = setInterval(next, 5000);
//     return () => { if (timer.current) clearInterval(timer.current); };
//   }, [current, going]);

//   return (
//     <div className="absolute inset-0 overflow-hidden">
//       {heroSlides.map((slide, i) => (
//         <div key={slide.id} className="absolute inset-0" style={{ opacity: i === current ? 1 : 0, transition: "opacity 900ms ease-in-out", zIndex: i === current ? 2 : 1 }}>
//           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.src})`, transform: i === current ? "scale(1.04)" : "scale(1)", transition: "transform 5200ms ease-out" }} />
//           <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
//         </div>
//       ))}
//       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
//         {heroSlides.map((_, i) => (
//           <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}>
//             <div className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`} />
//           </button>
//         ))}
//       </div>
//       <button onClick={() => goTo((current - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white text-xl flex items-center justify-center transition-all">‹</button>
//       <button onClick={next} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white text-xl flex items-center justify-center transition-all">›</button>
//     </div>
//   );
// }

// function CourseCard({ course }: { course: typeof courses[0] }) {
//   return (
//     <Link href={`/public/courses/${course.slug}`} className="group block">
//       <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
//         <div className="relative h-44 overflow-hidden bg-gray-100">
//           <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${course.thumb})` }} />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
//           <div className="absolute top-3 left-3"><span className="text-[10px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15 uppercase tracking-wide">{course.category}</span></div>
//           <div className="absolute top-3 right-3"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${course.levelColor}`}>{course.level}</span></div>
//           <div className="absolute bottom-3 left-4 text-2xl drop-shadow">{course.emoji}</div>
//         </div>
//         <div className="p-5">
//           <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
//           <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
//             <span className="flex items-center gap-1">
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
//               {course.duration}
//             </span>
//             <span className="flex items-center gap-1">
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
//               Certificate included
//             </span>
//           </div>
//           <div className="flex items-center justify-between pt-4 border-t border-gray-100">
//             <div><p className="text-[10px] text-gray-400 mb-0.5">Course fee</p><p className="font-bold text-gray-900 text-base">₦{course.price.toLocaleString()}</p></div>
//             <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">Enroll now</span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// }

// export default function HomePage() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [testIdx, setTestIdx] = useState(0);
//   const totalPages = Math.ceil(testimonials.length / 2);
//   const visibleTests = testimonials.slice(testIdx * 2, testIdx * 2 + 2);

//   useEffect(() => {
//     const close = () => setMenuOpen(false);
//     window.addEventListener("resize", close);
//     return () => window.removeEventListener("resize", close);
//   }, []);

//   return (
//     <div className="bg-white text-gray-900 min-h-screen font-sans overflow-x-hidden">

//       {/* ── NAV ── */}
//       <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
//         <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16">
//           <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
//             <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-blue-200">T</div>
//             <div className="leading-tight"><div className="font-black text-gray-900 text-sm">TERRA</div><div className="text-blue-600 font-bold text-[10px] tracking-wider">BYTE</div></div>
//           </Link>
//           <div className="hidden md:flex items-center gap-7 text-sm text-gray-500">
//             {navLinks.map((l) => (<Link key={l.href} href={l.href} className="hover:text-blue-600 transition-colors font-medium">{l.label}</Link>))}
//           </div>
//           <div className="hidden md:flex items-center gap-3">
//             <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium px-4 py-2 transition-colors">Sign In</Link>
//             <Link href="/auth/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200">Get Started</Link>
//           </div>
//           <button className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
//             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
//             </svg>
//           </button>
//         </div>
//         <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
//           <div className="border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-1">
//             {navLinks.map((l) => (<Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">{l.label}</Link>))}
//             <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
//               <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all">Sign In</Link>
//               <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all">Get Started</Link>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <section className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden">
//         <HeroSlider />
//         <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
//           <div className="max-w-2xl">
//             <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full mb-7 backdrop-blur-sm tracking-wide">
//               <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
//               Nigeria's Premier Technology Academy
//             </div>
//             <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5 drop-shadow-lg">
//               Learn Skills That<br /><span className="text-blue-300">Actually Matter</span>
//             </h1>
//             <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
//               Practical, industry-focused tech training for professionals in Nigeria. We teach cybersecurity, cloud computing, data science, and more — skills employers are actively looking for.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-3">
//               <Link href="/public/courses" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-blue-900/40">
//                 Browse All Courses
//                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
//               </Link>
//               <Link href="/about" className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all backdrop-blur-sm">About Us</Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── STATS ── */}
//       <section className="bg-blue-600">
//         <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
//           {stats.map((s) => (<div key={s.label} className="text-center"><p className="text-3xl md:text-4xl font-black text-white">{s.value}</p><p className="text-sm text-blue-200 mt-1">{s.label}</p></div>))}
//         </div>
//       </section>

//       {/* ── COURSES ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
//             <div>
//               <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">What We Offer</p>
//               <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">Featured Courses</h2>
//               <p className="text-gray-500 text-sm mt-2 max-w-md leading-relaxed">Professionally designed programmes taught by engineers and industry leaders with real working experience.</p>
//             </div>
//             <Link href="/public/courses" className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all">
//               View all courses
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
//             </Link>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {courses.map((c) => (<CourseCard key={c.slug} course={c} />))}
//           </div>
//         </div>
//       </section>

//       {/* ── HOW IT WORKS ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-14">
//             <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
//             <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">How It Works</h2>
//             <p className="text-gray-500 text-sm mt-2">Four steps from sign-up to career transformation</p>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
//             {[
//               { num: "01", icon: "🔍", title: "Choose a Course", desc: "Browse our catalogue and pick the programme that fits your goals and current skill level." },
//               { num: "02", icon: "🎯", title: "Pick a Mode", desc: "Learn online at your own pace, attend our Lagos campus on weekends, or book private sessions." },
//               { num: "03", icon: "💳", title: "Pay Securely", desc: "Complete payment via Paystack in seconds. Your full course access is unlocked immediately." },
//               { num: "04", icon: "🎓", title: "Earn Your Certificate", desc: "Complete all modules, pass assessments, and receive your verified digital certificate." },
//             ].map((item) => (
//               <div key={item.num} className="relative bg-gray-50 border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
//                 <div className="absolute top-4 right-5 text-5xl font-black text-gray-100 select-none leading-none">{item.num}</div>
//                 <div className="text-3xl mb-5">{item.icon}</div>
//                 <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1.5">{item.num}</p>
//                 <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
//                 <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── TESTIMONIALS ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-14">
//             <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Student Stories</p>
//             <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">What Our Alumni Say</h2>
//             <p className="text-gray-500 text-sm mt-2">Real outcomes from real students across Nigeria</p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {visibleTests.map((t) => (
//               <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 hover:shadow-md transition-all">
//                 <div className="flex gap-1 mb-5">{[...Array(5)].map((_,i)=>(<svg key={i} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>))}</div>
//                 <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
//                 <div className="mb-5"><span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">{t.course}</span></div>
//                 <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
//                   <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>{t.avatar}</div>
//                   <div><p className="font-semibold text-gray-900 text-sm">{t.name}</p><p className="text-gray-400 text-xs">{t.role}</p></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="flex items-center justify-center gap-3 mt-8">
//             <button onClick={()=>setTestIdx((p)=>(p-1+totalPages)%totalPages)} className="w-9 h-9 rounded-full border border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all text-lg">‹</button>
//             {[...Array(totalPages)].map((_,i)=>(<button key={i} onClick={()=>setTestIdx(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i===testIdx?"w-8 bg-blue-600":"w-2 bg-gray-200 hover:bg-gray-300"}`}/>))}
//             <button onClick={()=>setTestIdx((p)=>(p+1)%totalPages)} className="w-9 h-9 rounded-full border border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all text-lg">›</button>
//           </div>
//         </div>
//       </section>

//       {/* ── CTA ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-blue-600">
//         <div className="max-w-3xl mx-auto text-center">
//           <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">Start Today</p>
//           <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">Ready to transform your career?</h2>
//           <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg mx-auto">Join thousands of professionals across Nigeria who have built real, in-demand tech skills with Terrabyte Academy.</p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-700 font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg">Enroll Now — It is Simple →</Link>
//             <Link href="/contact" className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-2xl text-sm transition-all">Talk to Us First</Link>
//           </div>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer className="bg-gray-900 text-white px-6 md:px-12 pt-16 pb-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

//             <div className="sm:col-span-2 lg:col-span-1">
//               <Link href="/" className="flex items-center gap-2.5 mb-5">
//                 <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-black text-white">T</div>
//                 <div className="leading-tight"><div className="font-black text-white text-sm">TERRA</div><div className="text-blue-400 font-bold text-[10px] tracking-wider">BYTE</div></div>
//               </Link>
//               <p className="text-gray-400 text-sm leading-relaxed mb-5">Nigeria's premier technology learning platform, building career-ready professionals through practical, industry-focused training.</p>
//               <p className="text-gray-500 text-xs mb-4">RC: 1234567 · Lagos, Nigeria</p>
//               <div className="flex gap-2 flex-wrap">
//                 {[{label:"WhatsApp",href:"https://wa.me/234XXXXXXXXXX"},{label:"LinkedIn",href:"#"},{label:"Twitter",href:"#"},{label:"Instagram",href:"#"}].map((s)=>(
//                   <a key={s.label} href={s.href} className="text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/25 px-3 py-1.5 rounded-lg transition-all">{s.label}</a>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Popular Courses</p>
//               <div className="flex flex-col gap-3">
//                 {[
//                   {label:"Cybersecurity Fundamentals",href:"/public/courses/cybersecurity-fundamentals"},
//                   {label:"Data Analysis with Python",href:"/public/courses/data-analysis-python"},
//                   {label:"Cloud Architecture (AWS)",href:"/public/courses/cloud-architecture-aws"},
//                   {label:"Full-Stack Web Development",href:"/public/courses/fullstack-web-development"},
//                   {label:"UI/UX Design Mastery",href:"/public/courses/uiux-design-mastery"},
//                   {label:"Network Administration",href:"/public/courses/network-administration"},
//                 ].map((l)=>(<Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors leading-snug">{l.label}</Link>))}
//               </div>
//             </div>

//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Quick Links</p>
//               <div className="flex flex-col gap-3">
//                 {[
//                   {label:"All Courses",href:"/public/courses"},
//                   {label:"About Us",href:"/about"},
//                   {label:"Blog & News",href:"/public/blog"},
//                   {label:"Upcoming Events",href:"/public/events"},
//                   {label:"Contact Us",href:"/contact"},
//                   {label:"Verify Certificate",href:"/public/verify-certificate"},
//                   {label:"Student Login",href:"/auth/login"},
//                   {label:"Create Account",href:"/auth/register"},
//                 ].map((l)=>(<Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</Link>))}
//               </div>
//             </div>

//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Contact Us</p>
//               <div className="flex flex-col gap-4">
//                 <a href="mailto:hello@terrabyteacademy.com" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
//                   hello@terrabyteacademy.com
//                 </a>
//                 <a href="https://wa.me/234XXXXXXXXXX" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
//                   +234 800 000 0000
//                 </a>
//                 <span className="flex items-start gap-3 text-sm text-gray-400">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
//                   Victoria Island, Lagos, Nigeria
//                 </span>
//                 <span className="flex items-start gap-3 text-sm text-gray-400">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>
//                   Mon–Fri, 9am – 6pm WAT
//                 </span>
//                 <a href="https://wa.me/234XXXXXXXXXX" className="mt-1 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all w-fit">
//                   <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
//                   Chat on WhatsApp
//                 </a>
//               </div>
//             </div>
//           </div>

//           <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
//             <p className="text-xs text-gray-500 text-center sm:text-left">© {new Date().getFullYear()} Terrabyte Academy. RC: 1234567. All rights reserved.</p>
//             <div className="flex gap-5">
//               {["Privacy Policy","Terms of Service","Cookie Policy"].map((l)=>(<a key={l} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a>))}
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }





// // C:\Users\Melody\Documents\Terrabyte Academy\frontend\src\app\page.tsx
// "use client";

// import Link from "next/link";
// import { useState, useEffect, useRef } from "react";

// const heroSlides = [
//   { id: 1, src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1400&q=80&auto=format&fit=crop", alt: "Developer coding" },
//   { id: 2, src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&auto=format&fit=crop", alt: "Students collaborating" },
//   { id: 3, src: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1400&q=80&auto=format&fit=crop", alt: "Tech professional" },
// ];

// const courses = [
//   { title: "Cybersecurity Fundamentals", category: "Security", level: "Beginner", price: 75000, duration: "8 weeks", thumb: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&q=80&auto=format&fit=crop", emoji: "🔐", levelColor: "bg-green-100 text-green-700", slug: "cybersecurity-fundamentals" },
//   { title: "Data Analysis with Python", category: "Data Science", level: "Intermediate", price: 85000, duration: "10 weeks", thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop", emoji: "📊", levelColor: "bg-amber-100 text-amber-700", slug: "data-analysis-python" },
//   { title: "Cloud Architecture (AWS)", category: "Cloud", level: "Advanced", price: 120000, duration: "12 weeks", thumb: "https://images.unsplash.com/photo-1667984390527-850f63192709?w=600&q=80&auto=format&fit=crop", emoji: "☁️", levelColor: "bg-red-100 text-red-700", slug: "cloud-architecture-aws" },
//   { title: "Full-Stack Web Development", category: "Development", level: "Intermediate", price: 95000, duration: "16 weeks", thumb: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80&auto=format&fit=crop", emoji: "💻", levelColor: "bg-amber-100 text-amber-700", slug: "fullstack-web-development" },
//   { title: "UI/UX Design Mastery", category: "Design", level: "Beginner", price: 65000, duration: "8 weeks", thumb: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format&fit=crop", emoji: "🎨", levelColor: "bg-green-100 text-green-700", slug: "uiux-design-mastery" },
//   { title: "Network Administration", category: "Networking", level: "Intermediate", price: 80000, duration: "10 weeks", thumb: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80&auto=format&fit=crop", emoji: "🌐", levelColor: "bg-amber-100 text-amber-700", slug: "network-administration" },
// ];

// const testimonials = [
//   { name: "Adaeze Okonkwo", role: "Cybersecurity Analyst, Access Bank", quote: "Terrabyte Academy completely changed my career. The instructors bring real industry experience, and the hands-on projects prepared me from day one. I was employed within six months.", avatar: "AO", course: "Cybersecurity Fundamentals", avatarBg: "bg-blue-600" },
//   { name: "Emeka Nwosu", role: "Data Engineer, Flutterwave", quote: "Every module was immediately applicable at work. No fluff, just real skills. I landed my dream job at Flutterwave three months after graduating. Best decision I ever made.", avatar: "EN", course: "Data Analysis with Python", avatarBg: "bg-emerald-600" },
//   { name: "Fatima Bello", role: "Cloud Architect, Microsoft", quote: "The AWS course was incredibly thorough. My certificate opened doors I did not even know existed. The support team checked in on me throughout and after the programme.", avatar: "FB", course: "Cloud Architecture (AWS)", avatarBg: "bg-amber-600" },
//   { name: "Chukwudi Eze", role: "Senior Frontend Developer, Interswitch", quote: "I tried other platforms before but nothing matched the quality here. The instructors respond quickly, the student community is genuinely helpful, and the projects are the right kind of challenging.", avatar: "CE", course: "Full-Stack Web Development", avatarBg: "bg-purple-600" },
// ];

// const stats = [
//   { value: "2,400+", label: "Students Trained" },
//   { value: "48", label: "Courses Offered" },
//   { value: "96%", label: "Completion Rate" },
//   { value: "100%", label: "Job-Ready Graduates" },
// ];

// const navLinks = [
//   { label: "Courses", href: "/public/courses" },
//   { label: "About Us", href: "/about" },
//   { label: "Blog", href: "/public/blog" },
//   { label: "Events", href: "/public/events" },
//   { label: "Contact", href: "/contact" },
// ];

// function HeroSlider() {
//   const [current, setCurrent] = useState(0);
//   const [going, setGoing] = useState(false);
//   const timer = useRef<ReturnType<typeof setInterval> | null>(null);

//   const goTo = (idx: number) => {
//     if (going || idx === current) return;
//     setGoing(true);
//     setCurrent(idx);
//     setTimeout(() => setGoing(false), 900);
//   };
//   const next = () => goTo((current + 1) % heroSlides.length);

//   useEffect(() => {
//     timer.current = setInterval(next, 5000);
//     return () => { if (timer.current) clearInterval(timer.current); };
//   }, [current, going]);

//   return (
//     <div className="absolute inset-0 overflow-hidden">
//       {heroSlides.map((slide, i) => (
//         <div key={slide.id} className="absolute inset-0" style={{ opacity: i === current ? 1 : 0, transition: "opacity 900ms ease-in-out", zIndex: i === current ? 2 : 1 }}>
//           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.src})`, transform: i === current ? "scale(1.04)" : "scale(1)", transition: "transform 5200ms ease-out" }} />
//           <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
//         </div>
//       ))}
//       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
//         {heroSlides.map((_, i) => (
//           <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}>
//             <div className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`} />
//           </button>
//         ))}
//       </div>
//       <button onClick={() => goTo((current - 1 + heroSlides.length) % heroSlides.length)} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white text-xl flex items-center justify-center transition-all">‹</button>
//       <button onClick={next} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white text-xl flex items-center justify-center transition-all">›</button>
//     </div>
//   );
// }

// function CourseCard({ course }: { course: typeof courses[0] }) {
//   return (
//     <Link href={`/public/courses/${course.slug}`} className="group block">
//       <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
//         <div className="relative h-44 overflow-hidden bg-gray-100">
//           <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${course.thumb})` }} />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
//           <div className="absolute top-3 left-3"><span className="text-[10px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15 uppercase tracking-wide">{course.category}</span></div>
//           <div className="absolute top-3 right-3"><span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${course.levelColor}`}>{course.level}</span></div>
//           <div className="absolute bottom-3 left-4 text-2xl drop-shadow">{course.emoji}</div>
//         </div>
//         <div className="p-5">
//           <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
//           <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
//             <span className="flex items-center gap-1">
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
//               {course.duration}
//             </span>
//             <span className="flex items-center gap-1">
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
//               Certificate included
//             </span>
//           </div>
//           <div className="flex items-center justify-between pt-4 border-t border-gray-100">
//             <div><p className="text-[10px] text-gray-400 mb-0.5">Course fee</p><p className="font-bold text-gray-900 text-base">₦{course.price.toLocaleString()}</p></div>
//             <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">Enroll now</span>
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// }

// export default function HomePage() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [testIdx, setTestIdx] = useState(0);
//   const totalPages = Math.ceil(testimonials.length / 2);
//   const visibleTests = testimonials.slice(testIdx * 2, testIdx * 2 + 2);

//   useEffect(() => {
//     const close = () => setMenuOpen(false);
//     window.addEventListener("resize", close);
//     return () => window.removeEventListener("resize", close);
//   }, []);

//   return (
//     <div className="bg-white text-gray-900 min-h-screen font-sans overflow-x-hidden">

//       {/* ── NAV ── */}
//       <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
//         <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16">
//           <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
//             <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-blue-200">T</div>
//             <div className="leading-tight"><div className="font-black text-gray-900 text-sm">Terrabyte</div><div className="text-blue-600 font-bold text-[10px] tracking-wider">ACADEMY</div></div>
//           </Link>
//           <div className="hidden md:flex items-center gap-7 text-sm text-gray-500">
//             {navLinks.map((l) => (<Link key={l.href} href={l.href} className="hover:text-blue-600 transition-colors font-medium">{l.label}</Link>))}
//           </div>
//           <div className="hidden md:flex items-center gap-3">
//             <Link href="/auth/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium px-4 py-2 transition-colors">Sign In</Link>
//             <Link href="/auth/register" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200">Get Started</Link>
//           </div>
//           <button className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
//             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
//             </svg>
//           </button>
//         </div>
//         <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
//           <div className="border-t border-gray-100 bg-white px-5 py-4 flex flex-col gap-1">
//             {navLinks.map((l) => (<Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">{l.label}</Link>))}
//             <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
//               <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all">Sign In</Link>
//               <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all">Get Started</Link>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <section className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden">
//         <HeroSlider />
//         <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
//           <div className="max-w-2xl">
//             <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full mb-7 backdrop-blur-sm tracking-wide">
//               <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
//               Nigeria's Premier Technology Academy
//             </div>
//             <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.08] tracking-tight mb-5 drop-shadow-lg">
//               Learn Skills That<br /><span className="text-blue-300">Actually Matter</span>
//             </h1>
//             <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
//               Practical, industry-focused tech training for professionals in Nigeria. We teach cybersecurity, cloud computing, data science, and more — skills employers are actively looking for.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-3">
//               <Link href="/public/courses" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-blue-900/40">
//                 Browse All Courses
//                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
//               </Link>
//               <Link href="/about" className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all backdrop-blur-sm">About Us</Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── STATS ── */}
//       <section className="bg-blue-600">
//         <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
//           {stats.map((s) => (<div key={s.label} className="text-center"><p className="text-3xl md:text-4xl font-black text-white">{s.value}</p><p className="text-sm text-blue-200 mt-1">{s.label}</p></div>))}
//         </div>
//       </section>

//       {/* ── COURSES ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
//             <div>
//               <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">What We Offer</p>
//               <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">Featured Courses</h2>
//               <p className="text-gray-500 text-sm mt-2 max-w-md leading-relaxed">Professionally designed programmes taught by engineers and industry leaders with real working experience.</p>
//             </div>
//             <Link href="/public/courses" className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-all">
//               View all courses
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
//             </Link>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {courses.map((c) => (<CourseCard key={c.slug} course={c} />))}
//           </div>
//         </div>
//       </section>

//       {/* ── HOW IT WORKS ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-14">
//             <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Simple Process</p>
//             <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">How It Works</h2>
//             <p className="text-gray-500 text-sm mt-2">Four steps from sign-up to career transformation</p>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
//             {[
//               { num: "01", icon: "🔍", title: "Choose a Course", desc: "Browse our catalogue and pick the programme that fits your goals and current skill level." },
//               { num: "02", icon: "🎯", title: "Pick a Mode", desc: "Learn online at your own pace, attend our Lagos campus on weekends, or book private sessions." },
//               { num: "03", icon: "💳", title: "Pay Securely", desc: "Complete payment via Paystack in seconds. Your full course access is unlocked immediately." },
//               { num: "04", icon: "🎓", title: "Earn Your Certificate", desc: "Complete all modules, pass assessments, and receive your verified digital certificate." },
//             ].map((item) => (
//               <div key={item.num} className="relative bg-gray-50 border border-gray-100 rounded-2xl p-7 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
//                 <div className="absolute top-4 right-5 text-5xl font-black text-gray-100 select-none leading-none">{item.num}</div>
//                 <div className="text-3xl mb-5">{item.icon}</div>
//                 <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1.5">{item.num}</p>
//                 <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
//                 <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── TESTIMONIALS ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-14">
//             <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Student Stories</p>
//             <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">What Our Alumni Say</h2>
//             <p className="text-gray-500 text-sm mt-2">Real outcomes from real students across Nigeria</p>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {visibleTests.map((t) => (
//               <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 hover:shadow-md transition-all">
//                 <div className="flex gap-1 mb-5">{[...Array(5)].map((_,i)=>(<svg key={i} className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>))}</div>
//                 <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
//                 <div className="mb-5"><span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">{t.course}</span></div>
//                 <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
//                   <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>{t.avatar}</div>
//                   <div><p className="font-semibold text-gray-900 text-sm">{t.name}</p><p className="text-gray-400 text-xs">{t.role}</p></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="flex items-center justify-center gap-3 mt-8">
//             <button onClick={()=>setTestIdx((p)=>(p-1+totalPages)%totalPages)} className="w-9 h-9 rounded-full border border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all text-lg">‹</button>
//             {[...Array(totalPages)].map((_,i)=>(<button key={i} onClick={()=>setTestIdx(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i===testIdx?"w-8 bg-blue-600":"w-2 bg-gray-200 hover:bg-gray-300"}`}/>))}
//             <button onClick={()=>setTestIdx((p)=>(p+1)%totalPages)} className="w-9 h-9 rounded-full border border-gray-200 hover:border-blue-300 text-gray-400 hover:text-blue-600 flex items-center justify-center transition-all text-lg">›</button>
//           </div>
//         </div>
//       </section>

//       {/* ── CTA ── */}
//       <section className="py-20 md:py-28 px-6 md:px-12 bg-blue-600">
//         <div className="max-w-3xl mx-auto text-center">
//           <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">Start Today</p>
//           <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight leading-tight">Ready to transform your career?</h2>
//           <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-lg mx-auto">Join thousands of professionals across Nigeria who have built real, in-demand tech skills with Terrabyte Academy.</p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-blue-700 font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-lg">Enroll Now — It is Simple →</Link>
//             <Link href="/contact" className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-2xl text-sm transition-all">Talk to Us First</Link>
//           </div>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer className="bg-gray-900 text-white px-6 md:px-12 pt-16 pb-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

//             <div className="sm:col-span-2 lg:col-span-1">
//               <Link href="/" className="flex items-center gap-2.5 mb-5">
//                 <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-black text-white">T</div>
//                 <div className="leading-tight"><div className="font-black text-white text-sm">Terrabyte</div><div className="text-blue-400 font-bold text-[10px] tracking-wider">ACADEMY</div></div>
//               </Link>
//               <p className="text-gray-400 text-sm leading-relaxed mb-5">Nigeria's premier technology learning platform, building career-ready professionals through practical, industry-focused training.</p>
//               <p className="text-gray-500 text-xs mb-4">RC: 1234567 · Lagos, Nigeria</p>
//               <div className="flex gap-2 flex-wrap">
//                 {[{label:"WhatsApp",href:"https://wa.me/234XXXXXXXXXX"},{label:"LinkedIn",href:"#"},{label:"Twitter",href:"#"},{label:"Instagram",href:"#"}].map((s)=>(
//                   <a key={s.label} href={s.href} className="text-xs border border-white/10 text-gray-400 hover:text-white hover:border-white/25 px-3 py-1.5 rounded-lg transition-all">{s.label}</a>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Popular Courses</p>
//               <div className="flex flex-col gap-3">
//                 {[
//                   {label:"Cybersecurity Fundamentals",href:"/public/courses/cybersecurity-fundamentals"},
//                   {label:"Data Analysis with Python",href:"/public/courses/data-analysis-python"},
//                   {label:"Cloud Architecture (AWS)",href:"/public/courses/cloud-architecture-aws"},
//                   {label:"Full-Stack Web Development",href:"/public/courses/fullstack-web-development"},
//                   {label:"UI/UX Design Mastery",href:"/public/courses/uiux-design-mastery"},
//                   {label:"Network Administration",href:"/public/courses/network-administration"},
//                 ].map((l)=>(<Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors leading-snug">{l.label}</Link>))}
//               </div>
//             </div>

//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Quick Links</p>
//               <div className="flex flex-col gap-3">
//                 {[
//                   {label:"All Courses",href:"/public/courses"},
//                   {label:"About Us",href:"/about"},
//                   {label:"Blog & News",href:"/public/blog"},
//                   {label:"Upcoming Events",href:"/public/events"},
//                   {label:"Contact Us",href:"/contact"},
//                   {label:"Verify Certificate",href:"/public/verify-certificate"},
//                   {label:"Student Login",href:"/auth/login"},
//                   {label:"Create Account",href:"/auth/register"},
//                 ].map((l)=>(<Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</Link>))}
//               </div>
//             </div>

//             <div>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Contact Us</p>
//               <div className="flex flex-col gap-4">
//                 <a href="mailto:hello@terrabyteacademy.com" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
//                   hello@terrabyteacademy.com
//                 </a>
//                 <a href="https://wa.me/234XXXXXXXXXX" className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
//                   +234 800 000 0000
//                 </a>
//                 <span className="flex items-start gap-3 text-sm text-gray-400">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
//                   Victoria Island, Lagos, Nigeria
//                 </span>
//                 <span className="flex items-start gap-3 text-sm text-gray-400">
//                   <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg>
//                   Mon–Fri, 9am – 6pm WAT
//                 </span>
//                 <a href="https://wa.me/234XXXXXXXXXX" className="mt-1 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all w-fit">
//                   <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
//                   Chat on WhatsApp
//                 </a>
//               </div>
//             </div>
//           </div>

//           <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
//             <p className="text-xs text-gray-500 text-center sm:text-left">© {new Date().getFullYear()} Terrabyte Academy. RC: 1234567. All rights reserved.</p>
//             <div className="flex gap-5">
//               {["Privacy Policy","Terms of Service","Cookie Policy"].map((l)=>(<a key={l} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a>))}
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }



// import Link from "next/link";

// export default function HomePage() {
//   const stats = [{ value: "2,400+", label: "Students Enrolled" },{ value: "48", label: "Expert Courses" },{ value: "96%", label: "Completion Rate" },{ value: "100%", label: "Job-Ready Skills" }];
//   const courses = [
//     { title: "GIS and Remote Sensing Fundamentals", category: "Geographic Information Systems", level: "Beginner", price: 75000, duration: "8 weeks", icon: "🔐" },
//     { title: "Data Analysis with Python", category: "Data Science", level: "Intermediate", price: 85000, duration: "10 weeks", icon: "📊" },
//     { title: "ArcGIS Software Training", category: "Spatial Analysis", level: "Advanced", price: 120000, duration: "12 weeks", icon: "☁️" },
//     { title: "Surveying Fundamentals", category: "Surveying", level: "Intermediate", price: 95000, duration: "16 weeks", icon: "💻" },
//     { title: "Spatial Analysis Techniques", category: "AutoCad", level: "Beginner", price: 65000, duration: "8 weeks", icon: "🎨" },
//     { title: "Spatial Data Management", category: "Mapping", level: "Intermediate", price: 80000, duration: "10 weeks", icon: "🌐" },
//   ];
//   return (
//     <div className="bg-[#03091A] text-white min-h-screen">
//       <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-[#03091A]/80 backdrop-blur-xl">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-black text-white">T</div>
//           <span className="font-bold text-lg">Terrabyte <span className="text-brand-400">Academy</span></span>
//         </div>
//         <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
//           <Link href="/public/courses" className="hover:text-white transition-colors">Courses</Link>
//           <Link href="/public/blog" className="hover:text-white transition-colors">Blog</Link>
//           <Link href="/public/events" className="hover:text-white transition-colors">Events</Link>
//           <Link href="/public/verify-certificate" className="hover:text-white transition-colors">Verify</Link>
//         </div>
//         <div className="flex items-center gap-3">
//           <Link href="/auth/login" className="text-sm text-white/60 hover:text-white px-4 py-2 transition-colors">Sign In</Link>
//           <Link href="/auth/register" className="text-sm bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-xl font-semibold transition-all">Get Started</Link>
//         </div>
//       </nav>

//       <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
//         <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
//         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#378add 1px,transparent 1px),linear-gradient(90deg,#378add 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
//         <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 w-full">
//           <div className="max-w-4xl">
//             <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
//               <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" /> Nigeria&apos;s Premier GIS Academy
//             </div>
//             <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
//               Learn Skills That<br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500">Actually Matter</span>
//             </h1>
//             <p className="text-lg text-white/50 max-w-2xl leading-relaxed mb-10">Industry-focused technology training designed for the future. From Spatial Analysis to Geospatial Computing, we build careers, not just credentials.</p>
//             <div className="flex flex-col sm:flex-row gap-4">
//               <Link href="/public/courses" className="group inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-brand-900/50">
//                 Explore Courses <span className="group-hover:translate-x-1 transition-transform">→</span>
//               </Link>
//               <Link href="/public/verify-certificate" className="inline-flex items-center gap-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-semibold text-base transition-all">Verify Certificate</Link>
//             </div>
//           </div>
//           <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/5 pt-12">
//             {stats.map((s) => (<div key={s.label}><p className="text-3xl md:text-4xl font-black text-white">{s.value}</p><p className="text-sm text-white/40 mt-1">{s.label}</p></div>))}
//           </div>
//         </div>
//       </section>

//       <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
//         <div className="flex items-end justify-between mb-14">
//           <div><p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">What We Offer</p><h2 className="text-4xl md:text-5xl font-black tracking-tight">Featured Courses</h2></div>
//           <Link href="/public/courses" className="hidden md:flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">View all →</Link>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//           {courses.map((course, i) => (
//             <Link href="/public/courses" key={i} className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-brand-500/40 rounded-2xl p-6 transition-all duration-300">
//               <div className="flex items-start justify-between mb-4"><span className="text-3xl">{course.icon}</span><span className="text-xs border border-white/10 text-white/50 px-2.5 py-1 rounded-full">{course.level}</span></div>
//               <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-2">{course.category}</p>
//               <h3 className="font-bold text-lg leading-snug mb-4 group-hover:text-brand-300 transition-colors">{course.title}</h3>
//               <div className="flex items-center gap-4 text-xs text-white/35 mb-5"><span>🕐 {course.duration}</span><span>✓ Certificate</span></div>
//               <div className="flex items-center justify-between pt-4 border-t border-white/5">
//                 <span className="font-black text-lg">₦{course.price.toLocaleString()}</span>
//                 <span className="text-xs text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">Enroll →</span>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </section>

//       <footer className="border-t border-white/5 px-6 md:px-12 py-12">
//         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center font-black text-sm text-white">T</div>
//             <span className="font-bold text-sm text-white">Terrabyte Academy</span>
//           </div>
//           <p className="text-xs text-white/25">© {new Date().getFullYear()} Terrabyte Academy. RC: 1234567. All rights reserved.</p>
//           <div className="flex gap-6"><a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy</a><a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Terms</a></div>
//         </div>
//       </footer>
//     </div>
//   );
// }
