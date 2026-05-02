// C:\Users\Melody\Documents\Terrabyte Academy\frontend\src\app\about\page.tsx

import Link from "next/link";

const team = [
  { name: "Dr. Akinwale Obi", role: "Chief Executive Officer", bio: "15+ years in tech education. Former Google Africa engineer.", avatar: "AO" },
  { name: "Ngozi Adeleke", role: "Head of Curriculum", bio: "Ex-Microsoft. Designed award-winning tech programmes across Africa.", avatar: "NA" },
  { name: "Tunde Fashola", role: "Lead Instructor — Cybersecurity", bio: "Certified CISSP. 10 years in enterprise security consulting.", avatar: "TF" },
  { name: "Amaka Okonkwo", role: "Student Success Manager", bio: "Passionate about helping students land their first tech role.", avatar: "AM" },
];

const values = [
  { icon: "🎯", title: "Excellence", desc: "We hold ourselves to the highest standard in curriculum design, instruction, and student support." },
  { icon: "🤝", title: "Community", desc: "We believe in learning together. Our alumni network spans Nigeria and the diaspora." },
  { icon: "🔬", title: "Practical Learning", desc: "Every course is built around real-world projects, not just theory." },
  { icon: "🚀", title: "Career Outcomes", desc: "We measure success by where our students go, not just whether they finish." },
];

export default function AboutPage() {
  return (
    <div className="bg-[#03091A] text-white min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#03091A]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a6ebf] to-[#0e4a80] flex items-center justify-center text-sm font-black text-white">T</div>
            <span className="font-black text-base">Terrabyte <span className="text-[#378add]">Academy</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-white/55 hover:text-white transition-colors">← Back to Home</Link>
            <Link href="/auth/register" className="text-sm bg-[#1a6ebf] hover:bg-[#185fa5] px-5 py-2.5 rounded-xl font-bold transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[#1a6ebf]/8 blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <p className="text-[#378add] text-xs font-bold uppercase tracking-widest mb-4">Our Story</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            We Build Africa&apos;s<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5ba3e8] to-[#1a6ebf]">Tech Professionals</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto">
            Terrabyte Academy was founded with a single mission: to close the tech skills gap in Nigeria by providing world-class, accessible, and career-focused technology education.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 md:px-12 border-y border-white/[0.05] bg-[#040d1c]/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Our Mission", icon: "🎯", text: "To provide Nigeria's most career-relevant technology education — making every course a direct pathway to employment, entrepreneurship, or advancement." },
            { label: "Our Vision", icon: "🌍", text: "A future where every African professional has access to world-class tech skills, enabling them to compete globally and build transformative solutions locally." },
            { label: "Our Promise", icon: "✅", text: "We don't just teach — we transform. Every student who completes a programme leaves with verified skills, a certificate, and a community behind them." },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-8">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-white text-lg mb-3">{item.label}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#378add] text-xs font-bold uppercase tracking-widest mb-3">What Drives Us</p>
            <h2 className="text-4xl font-black tracking-tight">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-[#071428] border border-white/[0.07] rounded-2xl p-7 hover:border-[#1a6ebf]/30 transition-colors">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-white text-base mb-2">{v.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 md:px-12 border-t border-white/[0.05] bg-[#040d1c]/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#378add] text-xs font-bold uppercase tracking-widest mb-3">The People</p>
            <h2 className="text-4xl font-black tracking-tight">Meet the Team</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((member) => (
              <div key={member.name} className="bg-[#071428] border border-white/[0.07] rounded-2xl p-7 text-center hover:border-[#1a6ebf]/25 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a6ebf] to-[#0a3d6b] flex items-center justify-center text-xl font-black text-white mx-auto mb-4 shadow-lg shadow-[#1a6ebf]/20">
                  {member.avatar}
                </div>
                <h3 className="font-bold text-white text-sm mb-1">{member.name}</h3>
                <p className="text-[#378add] text-xs font-semibold mb-3">{member.role}</p>
                <p className="text-white/40 text-xs leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 md:px-12 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[{ value: "2,400+", label: "Students Trained" },{ value: "48", label: "Courses Offered" },{ value: "96%", label: "Completion Rate" },{ value: "412", label: "Certificates Issued" }].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5ba3e8] to-[#1a6ebf] mb-1">{s.value}</p>
                <p className="text-white/40 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 md:px-12 text-center border-t border-white/[0.05]">
        <h2 className="text-3xl font-black text-white mb-4">Ready to Join Our Community?</h2>
        <p className="text-white/45 mb-8">Take the first step towards a future-proof tech career today.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-[#1a6ebf] hover:bg-[#185fa5] px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-[#1a6ebf]/25">Enroll Now →</Link>
          <Link href="/contact" className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 px-8 py-4 rounded-2xl font-semibold transition-all">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}