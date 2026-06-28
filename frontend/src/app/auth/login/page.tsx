"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import { useLogin } from "@/hooks/useAuth";
import { useState } from "react";

const schema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(6, "At least 6 characters") });
type FormData = z.infer<typeof schema>;
const inputCls = "w-full bg-white/[0.04] border border-white/10 focus:border-brand-500 text-white placeholder:text-white/20 rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:ring-1 focus:ring-brand-500/40";

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  return (
    <div className="min-h-screen page-light flex overflow-hidden text-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-900 to-[#03091A]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#378add 1px,transparent 1px),linear-gradient(90deg,#378add 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative flex items-center gap-3 z-10">
          <BrandLogo />
        </div>
        <div className="relative z-10">
          <div className="text-6xl text-brand-700/50 font-serif leading-none mb-3">&ldquo;</div>
          <p className="text-white/80 text-xl font-medium leading-relaxed max-w-sm mb-6">The investment I made at Terrabyte paid back tenfold within six months of graduating.</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-xs font-bold text-white">EN</div>
            <div><p className="text-white font-semibold text-sm">Emeka Nwosu</p><p className="text-white/40 text-xs">Data Engineer, Flutterwave</p></div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[{n:"2,400+",l:"Students"},{n:"48",l:"Courses"},{n:"96%",l:"Completion"}].map(s=>(
            <div key={s.l} className="bg-white/5 border border-white/10 rounded-xl p-4"><p className="text-white font-black text-xl">{s.n}</p><p className="text-white/40 text-xs mt-0.5">{s.l}</p></div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-[#040d1c]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <BrandLogo />
          </div>
          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Welcome back</h1>
          <p className="text-white/70 text-sm mb-10">Sign in to continue your learning journey</p>
          <form onSubmit={handleSubmit((d) => login(d))} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-widest mb-2">Email Address</label>
              <input {...register("email")} type="email" placeholder="you@example.com" className={inputCls} />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">⚠ {errors.email.message}</p>}
            </div>
            <div>
              <div className="flex justify-between items-center mb-2"><label className="text-xs font-semibold text-white/70 uppercase tracking-widest">Password</label><Link href="/auth/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">Forgot password?</Link></div>
              <div className="relative">
                <input {...register("password")} type={showPw ? "text" : "password"} placeholder="••••••••" className={inputCls + " pr-11"} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm">{showPw ? "🙈" : "👁"}</button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">⚠ {errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isPending} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 mt-2">
              {isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In →</>}
            </button>
          </form>
          <div className="relative my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div><div className="relative flex justify-center"><span className="bg-[#040d1c] px-3 text-xs text-white/90">New to Terrabyte?</span></div></div>
          <Link href="/auth/register" className="w-full block text-center border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-semibold py-3.5 rounded-xl transition-all text-sm">Create an Account</Link>
        </div>
      </div>
    </div>
  );
}
