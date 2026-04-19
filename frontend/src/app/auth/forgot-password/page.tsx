"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await api.post("/auth/forgot-password", { email }); setSent(true); }
    catch { toast.error("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#03091A] flex items-center justify-center px-6">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-black text-white">T</div><span className="font-bold text-white text-lg">Terrabyte Academy</span></Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Reset your password</h1>
          <p className="text-white/40 text-sm mt-2">We&apos;ll send a reset link to your email</p>
        </div>
        {sent ? (
          <div className="bg-white/[0.02] border border-brand-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-white/50 text-sm mb-6">We sent a reset link to <strong className="text-white">{email}</strong></p>
            <Link href="/auth/login" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">← Back to login</Link>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Email Address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-white/[0.04] border border-white/10 focus:border-brand-500 text-white placeholder:text-white/20 rounded-xl px-4 py-3.5 text-sm outline-none transition-all" /></div>
              <button type="submit" disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">{loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}</button>
            </form>
            <div className="text-center mt-6"><Link href="/auth/login" className="text-sm text-white/35 hover:text-white transition-colors">← Back to login</Link></div>
          </div>
        )}
      </div>
    </div>
  );
}
