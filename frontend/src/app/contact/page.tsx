// C:\Users\Melody\Documents\Terrabyte Academy\frontend\src\app\contact\page.tsx

"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

const inputCls = "w-full bg-white/[0.04] border border-white/10 focus:border-[#1a6ebf] text-white placeholder:text-white/20 rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:ring-1 focus:ring-[#1a6ebf]/40";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to backend /contact endpoint
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
    toast.success("Message sent! We'll get back to you within 24 hours.");
  };

  const contactInfo = [
    { icon: "📧", label: "Email", value: "hello@terrabyteacademy.com", href: "mailto:hello@terrabyteacademy.com" },
    { icon: "💬", label: "WhatsApp", value: "+234 800 000 0000", href: "https://wa.me/234XXXXXXXXXX" },
    { icon: "📍", label: "Address", value: "Victoria Island, Lagos, Nigeria", href: "#" },
    { icon: "🕐", label: "Office Hours", value: "Mon–Fri, 9am – 6pm WAT", href: null },
  ];

  return (
    <div className="page-light min-h-screen text-slate-950">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl text-slate-950">
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a6ebf] to-[#0e4a80] flex items-center justify-center text-sm font-black text-white">T</div>
            <span className="font-black text-base">Terrabyte <span className="text-[#378add]">Academy</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-950 transition-colors">← Back to Home</Link>
            <Link href="/auth/register" className="text-sm bg-[#1a6ebf] hover:bg-[#185fa5] px-5 py-2.5 rounded-xl font-bold transition-all text-white">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-24 px-6 md:px-12">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-white/95 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute left-0 top-28 h-64 w-64 rounded-full bg-slate-300/30 blur-3xl" />
        <div className="relative max-w-7xl mx-auto grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-8">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-500 mb-3">Support made for ambitious learners</p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-950">Reach out and get expert help choosing the right path.</h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                Our team is ready to answer questions about courses, payments, partnerships, and how you can start your tech career with confidence.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="page-surface rounded-3xl p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-3">Fast reply</p>
                <p className="text-3xl font-black text-slate-950">Under 1 hour</p>
              </div>
              <div className="page-surface rounded-3xl p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-3">Tailored advice</p>
                <p className="text-3xl font-black text-slate-950">Course matching</p>
              </div>
              <div className="page-surface rounded-3xl p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-3">Premium care</p>
                <p className="text-3xl font-black text-slate-950">Success-focused</p>
              </div>
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-slate-200 bg-white/95 p-10 shadow-[0_40px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-8">
              <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-sm font-semibold text-brand-700">Premium support</span>
              <h2 className="mt-6 text-3xl font-black text-slate-950">Let&apos;s get your questions answered</h2>
              <p className="mt-3 text-slate-600">Send a message and our admissions advisors will share the best learning options for your goals.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-2">Email</p>
                <p className="font-semibold text-slate-950">hello@terrabyteacademy.com</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-2">WhatsApp</p>
                <p className="font-semibold text-slate-950">+234 800 000 0000</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-2">Office hours</p>
                <p className="font-semibold text-slate-950">Mon–Fri, 9am – 6pm WAT</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400 mb-2">Location</p>
                <p className="font-semibold text-slate-950">Victoria Island, Lagos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Contact info sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <div className="page-surface rounded-2xl p-7">
              <h2 className="font-bold text-slate-950 text-base mb-6">Contact Information</h2>
              <div className="space-y-5">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1a6ebf]/10 flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-xs text-black/65 font-semibold uppercase tracking-wider mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-black hover:text-[#5ba3e8] transition-colors">{item.value}</a>
                      ) : (
                        <p className="text-sm text-black">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/234XXXXXXXXXX"
              className="flex items-center gap-4 page-surface border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/15 flex items-center justify-center text-2xl flex-shrink-0">💬</div>
              <div>
                <p className="font-bold text-black text-sm group-hover:text-[#25D366] transition-colors">Chat on WhatsApp</p>
                <p className="text-black/40 text-xs mt-0.5">Fastest response — usually within 1 hour</p>
              </div>
              <svg className="w-4 h-4 text-black/30 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </a>

            {/* Map placeholder */}
            <div className="page-surface rounded-2xl overflow-hidden">
              <div className="h-40 bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-white/40 text-xs">Victoria Island, Lagos</p>
                  <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-[#378add] text-xs hover:underline mt-1 block">Open in Google Maps →</a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="bg-[#071428] border border-white/[0.07] rounded-2xl p-8">
              <h2 className="font-bold text-white text-base mb-6">Send Us a Message</h2>

              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="font-bold text-white text-xl mb-2">Message Sent!</h3>
                  <p className="text-white/45 text-sm mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <button onClick={() => setSent(false)} className="text-[#378add] text-sm hover:text-[#5ba3e8] transition-colors">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Full Name *</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Adaeze Okonkwo" required className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Email Address *</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Phone Number</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Subject *</label>
                      <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className={inputCls + " cursor-pointer"}>
                        <option value="" style={{ background: "#071428" }}>Select a subject</option>
                        <option value="course" style={{ background: "#071428" }}>Course Enquiry</option>
                        <option value="payment" style={{ background: "#071428" }}>Payment Support</option>
                        <option value="partnership" style={{ background: "#071428" }}>Partnership / Sponsorship</option>
                        <option value="technical" style={{ background: "#071428" }}>Technical Support</option>
                        <option value="other" style={{ background: "#071428" }}>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help you..."
                      required
                      rows={5}
                      className={inputCls + " resize-none"}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1a6ebf] hover:bg-[#185fa5] disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1a6ebf]/20"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Send Message →</>
                    )}
                  </button>

                  <p className="text-center text-xs text-white/25">
                    We typically respond within 24 hours on business days.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}