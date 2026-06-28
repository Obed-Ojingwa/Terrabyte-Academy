"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useMyCertificates } from "@/hooks/useCertificates";
import { useMyEnrollments } from "@/hooks/useCourses";
import { toast } from "react-hot-toast";

export default function StudentCertificatesPage() {
  const qc = useQueryClient();
  const { data: certificates = [] } = useMyCertificates();
  const { data: enrollments = [] } = useMyEnrollments();

  const requestedCourseIds = useMemo(
    () => new Set(certificates.map((cert: any) => cert.course_id || cert.course?.id)),
    [certificates],
  );

  const eligibleEnrollments = useMemo(
    () =>
      (enrollments ?? []).filter((enrollment: any) => {
        const courseId = enrollment.course_id || enrollment.course?.id;
        return (
          enrollment.progress >= 100 &&
          courseId &&
          !requestedCourseIds.has(courseId)
        );
      }),
    [enrollments, requestedCourseIds],
  );

  const requestCertificateMutation = useMutation({
    mutationFn: async (courseId: string) => (await api.post("/certificates/request", null, { params: { course_id: courseId } })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-certificates"] });
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast.success("Certificate request submitted");
    },
    onError: () => toast.error("Unable to request certificate"),
  });

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500">View your issued certificates and verification IDs.</p>
      </div>

      {eligibleEnrollments.length > 0 && (
        <div className="mb-6 rounded-3xl border border-slate-200/70 bg-slate-50 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Request certificates for completed courses</h2>
              <p className="mt-1 text-sm text-slate-600">You can request a certificate for any completed course that does not yet have one.</p>
            </div>
          </div>
          <div className="space-y-3">
            {eligibleEnrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-slate-950">{enrollment.course?.title ?? "Completed course"}</div>
                  <div className="text-sm text-slate-500">Progress: {enrollment.progress ?? 0}%</div>
                </div>
                <button
                  type="button"
                  onClick={() => requestCertificateMutation.mutate(enrollment.course_id ?? enrollment.course?.id)}
                  disabled={requestCertificateMutation.isPending}
                  className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Request certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {certificates.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/70 bg-white p-8 text-center text-slate-500">
            <p className="font-semibold text-slate-950">No certificates yet</p>
            <p className="mt-2 text-sm">Complete a course and request a certificate from your dashboard.</p>
          </div>
        ) : (
          certificates.map((cert: any) => (
            <div key={cert.id} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-950">{cert.certificate_number}</div>
                  <div className="mt-1 text-sm text-slate-500">Status: {cert.status}</div>
                </div>
                <div className="text-sm text-brand-600">{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("en-NG") : "Pending"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
