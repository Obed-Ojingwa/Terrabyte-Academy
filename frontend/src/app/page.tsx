import Link from "next/link";

export default function HomePage() {
  const stats = [{ value: "2,400+", label: "Students Enrolled" },{ value: "48", label: "Expert Courses" },{ value: "96%", label: "Completion Rate" },{ value: "100%", label: "Job-Ready Skills" }];
  const courses = [
    { title: "Cybersecurity Fundamentals", category: "Security", level: "Beginner", price: 75000, duration: "8 weeks", icon: "🔐" },
    { title: "Data Analysis with Python", category: "Data Science", level: "Intermediate", price: 85000, duration: "10 weeks", icon: "📊" },
    { title: "Cloud Architecture (AWS)", category: "Cloud", level: "Advanced", price: 120000, duration: "12 weeks", icon: "☁️" },
    { title: "Full-Stack Web Development", category: "Development", level: "Intermediate", price: 95000, duration: "16 weeks", icon: "💻" },
    { title: "UI/UX Design Mastery", category: "Design", level: "Beginner", price: 65000, duration: "8 weeks", icon: "🎨" },
    { title: "Network Administration", category: "Networking", level: "Intermediate", price: 80000, duration: "10 weeks", icon: "🌐" },
  ];
  return (
    <div className="bg-[#03091A] text-white min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-[#03091A]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-black text-white">T</div>
          <span className="font-bold text-lg">Terrabyte <span className="text-brand-400">Academy</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <Link href="/public/courses" className="hover:text-white transition-colors">Courses</Link>
          <Link href="/public/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/public/events" className="hover:text-white transition-colors">Events</Link>
          <Link href="/public/verify-certificate" className="hover:text-white transition-colors">Verify</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-white/60 hover:text-white px-4 py-2 transition-colors">Sign In</Link>
          <Link href="/auth/register" className="text-sm bg-brand-500 hover:bg-brand-600 px-5 py-2.5 rounded-xl font-semibold transition-all">Get Started</Link>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#378add 1px,transparent 1px),linear-gradient(90deg,#378add 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" /> Nigeria&apos;s Premier Tech Academy
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Learn Skills That<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500">Actually Matter</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed mb-10">Industry-focused technology training designed for the future. From cybersecurity to cloud computing — we build careers, not just credentials.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/public/courses" className="group inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-brand-900/50">
                Explore Courses <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/public/verify-certificate" className="inline-flex items-center gap-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-semibold text-base transition-all">Verify Certificate</Link>
            </div>
          </div>
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/5 pt-12">
            {stats.map((s) => (<div key={s.label}><p className="text-3xl md:text-4xl font-black text-white">{s.value}</p><p className="text-sm text-white/40 mt-1">{s.label}</p></div>))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-14">
          <div><p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">What We Offer</p><h2 className="text-4xl md:text-5xl font-black tracking-tight">Featured Courses</h2></div>
          <Link href="/public/courses" className="hidden md:flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <Link href="/public/courses" key={i} className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-brand-500/40 rounded-2xl p-6 transition-all duration-300">
              <div className="flex items-start justify-between mb-4"><span className="text-3xl">{course.icon}</span><span className="text-xs border border-white/10 text-white/50 px-2.5 py-1 rounded-full">{course.level}</span></div>
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-2">{course.category}</p>
              <h3 className="font-bold text-lg leading-snug mb-4 group-hover:text-brand-300 transition-colors">{course.title}</h3>
              <div className="flex items-center gap-4 text-xs text-white/35 mb-5"><span>🕐 {course.duration}</span><span>✓ Certificate</span></div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="font-black text-lg">₦{course.price.toLocaleString()}</span>
                <span className="text-xs text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">Enroll →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-700 flex items-center justify-center font-black text-sm text-white">T</div>
            <span className="font-bold text-sm text-white">Terrabyte Academy</span>
          </div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} Terrabyte Academy. RC: 1234567. All rights reserved.</p>
          <div className="flex gap-6"><a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy</a><a href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">Terms</a></div>
        </div>
      </footer>
    </div>
  );
}
