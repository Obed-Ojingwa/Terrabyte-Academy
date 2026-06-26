"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function StudentCertificatesPage() {
  const { data: certificates = [] } = useQuery({ queryKey: ["student-certificates"], queryFn: async () => (await api.get("/certificates/me")).data });

  return (
    <div className="min-h-full bg-[#03091A] p-6 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Certificates</h1>
        <p className="mt-1 text-sm text-white/40">View your issued certificates and verification IDs.</p>
      </div>
      <div className="space-y-3">
        {certificates.map((cert: any) => (
          <div key={cert.id} className="rounded-3xl border border-white/10 bg-[#071428] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{cert.certificate_number}</div>
                <div className="mt-1 text-sm text-white/40">Status: {cert.status}</div>
              </div>
              <div className="text-sm text-brand-300">{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("en-NG") : "Pending"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
