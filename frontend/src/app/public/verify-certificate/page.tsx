"use client";
import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import PublicHeader from "@/components/ui/PublicHeader";

type VerificationResult = {
  certificate_number: string;
  recipient_name: string;
  course_title: string;
  issued_at: string;
  status: "issued";
  issuer: string;
};

export default function VerifyCertificatePage() {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const serial = new URLSearchParams(window.location.search).get("serial")?.trim().toUpperCase();
    if (!serial) return;
    let active = true;
    setCertId(serial);
    setLoading(true);
    setError("");
    api.get(`/certificates/verify/${encodeURIComponent(serial)}`)
      .then(({ data }) => { if (active) setResult(data); })
      .catch(() => { if (active) setError("This serial number is not an issued Terrabyte Academy certificate."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const serial = certId.trim().toUpperCase();
    if (!serial) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.get(`/certificates/verify/${encodeURIComponent(serial)}`);
      setResult(data);
    } catch {
      setError("This serial number is not an issued Terrabyte Academy certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen page-light flex flex-col items-center px-6 pb-16 pt-28 text-slate-950">
      <PublicHeader />
      <section className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700"><ShieldCheck size={24} /></div>
          <p className="mb-2 text-xs font-bold uppercase text-blue-700">Certificate Verification</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Check authenticity</h1>
          <p className="mt-3 text-sm text-slate-600">Enter the serial printed on a certificate, or scan its QR code to verify it automatically.</p>
        </div>
        <form onSubmit={verify} className="mb-6 flex gap-3">
          <input
            value={certId}
            onChange={(event) => setCertId(event.target.value)}
            placeholder="TBA-XXXXXXXXXX"
            aria-label="Certificate serial number"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-mono text-sm text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" disabled={loading || !certId.trim()} className="rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Checking..." : "Verify"}
          </button>
        </form>
        {loading && <p role="status" className="py-4 text-center text-sm text-slate-600">Checking the Terrabyte Academy registry...</p>}
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><p className="font-bold text-red-800">Certificate not verified</p><p className="mt-1 text-sm text-red-700">{error}</p></div>}
        {result && (
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
              <BadgeCheck className="shrink-0 text-emerald-700" size={25} />
              <div>
                <p className="font-bold text-emerald-900">Certificate verified</p>
                <p className="text-sm text-emerald-800">Record confirmed by Terrabyte Academy</p>
              </div>
            </div>
            <dl className="divide-y divide-slate-100 px-5">
              {[
                { label: "Awarded to", value: result.recipient_name },
                { label: "Programme", value: result.course_title },
                { label: "Serial number", value: result.certificate_number },
                { label: "Date awarded", value: new Date(result.issued_at).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) },
                { label: "Issuer", value: result.issuer },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="px-5 pb-5 text-xs text-slate-500">Verified on <a className="font-semibold text-blue-700 underline" href="https://www.terrabyte.ng">www.terrabyte.ng</a></p>
          </div>
        )}
      </section>
    </main>
  );
}
