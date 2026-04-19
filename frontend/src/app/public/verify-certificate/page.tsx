"use client";
import { useState } from "react";
import api from "@/lib/api";

export default function VerifyCertificatePage() {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const verify = async (e: React.FormEvent) => {
    e.preventDefault(); if (!certId.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try { const { data } = await api.get(`/certificates/verify/${certId.trim().toUpperCase()}`); setResult(data); }
    catch { setError("Certificate not found or invalid. Please check the ID and try again."); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#03091A] flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:"linear-gradient(#378add 1px,transparent 1px),linear-gradient(90deg,#378add 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
      <div className="relative w-full max-w-lg text-center">
        <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest mb-4">Certificate Verification</p>
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Verify a Certificate</h1>
        <p className="text-white/40 text-sm mb-10">Enter the certificate ID found at the bottom of any Terrabyte Academy certificate</p>
        <form onSubmit={verify} className="flex gap-3 mb-8">
          <input value={certId} onChange={e=>setCertId(e.target.value)} placeholder="e.g. TBA-7F3A2B9C1E" className="flex-1 bg-white/[0.04] border border-white/10 focus:border-brand-500 text-white placeholder:text-white/20 rounded-xl px-4 py-3.5 text-sm outline-none transition-all font-mono"/>
          <button type="submit" disabled={loading} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2">{loading?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:"Verify"}</button>
        </form>
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center"><p className="text-4xl mb-3">❌</p><p className="text-red-400 font-semibold mb-1">Certificate Not Found</p><p className="text-white/40 text-sm">{error}</p></div>}
        {result && (
          <div className="bg-white/[0.02] border border-brand-500/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-brand-800/50 to-brand-900/50 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-lg">✅</div>
              <div className="text-left"><p className="font-bold text-white">Certificate Verified</p><p className="text-white/40 text-xs">This is an authentic Terrabyte Academy certificate</p></div>
            </div>
            <div className="p-6 space-y-3">
              {[{label:"Certificate ID",value:result.certificate_number},{label:"Status",value:result.status},{label:"Issue Date",value:result.issued_at?new Date(result.issued_at).toLocaleDateString("en-NG",{year:"numeric",month:"long",day:"numeric"}):"—"}].map(({label,value})=>(
                <div key={label} className="flex justify-between items-center text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-white/40">{label}</span><span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
