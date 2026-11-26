"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import StatCard from "@/components/dashboard/StatCard";
import { BookOpen, CheckCircle, Trophy, Award, ArrowRight, LockKeyhole } from "lucide-react";
import { toast } from "react-hot-toast";
import PaystackButton from "@/components/payments/PaystackButton";

export default function StudentDashboard() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [reportingCourseId, setReportingCourseId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const { data: stats } = useQuery({ queryKey: ["student-stats"], queryFn: async () => (await api.get("/analytics/student/stats")).data });
  const { data: dashboard } = useQuery({ queryKey: ["student-dashboard"], queryFn: async () => (await api.get("/student/dashboard")).data });
  const { data: paymentsData } = useQuery({
    queryKey: ["student-payments"],
    queryFn: async () => (await api.get("/payments/me")).data,
  });
  const { data: profile } = useQuery({ queryKey: ["student-profile"], queryFn: async () => (await api.get("/student/profile")).data });
  const { data: certificates = [] } = useQuery({
    queryKey: ["student-certificates"],
    queryFn: async () => (await api.get("/certificates/me")).data,
    refetchInterval: (query) =>
      query.state.data?.some((certificate: { status: string }) => certificate.status === "generating") ? 3000 : false,
  });
  const nextSteps = stats?.next_up ?? [];

  const requestCertificateMutation = useMutation({
    mutationFn: async (courseId: string) => api.post("/certificates/request", null, { params: { course_id: courseId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student-certificates"] }); toast.success("Certificate request submitted"); },
    onError: () => toast.error("Unable to request certificate")
  });

  const reportPaymentMutation = useMutation({
    mutationFn: async (courseId: string) =>
      (await api.post("/payments/report", {
        course_id: courseId,
        reference: paymentReference.trim() || undefined,
        message: paymentMessage.trim() || undefined,
      })).data,
    onSuccess: async (result) => {
      toast.success(result.message);
      setReportingCourseId(null);
      setPaymentReference("");
      setPaymentMessage("");
      await qc.invalidateQueries({ queryKey: ["student-payments"] });
      await qc.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || "Unable to report payment"),
  });

  const enrollments = useMemo(() => dashboard?.enrollments ?? [], [dashboard]);
  const latestPaymentByCourse = useMemo(() => {
    const paymentByCourse = new Map<string, any>();
    for (const payment of paymentsData?.items ?? []) {
      if (payment.course_id && !paymentByCourse.has(payment.course_id)) {
        paymentByCourse.set(payment.course_id, payment);
      }
    }
    return paymentByCourse;
  }, [paymentsData]);
  const certificateCourseIds = useMemo(
    () => new Set(certificates.map((certificate: any) => certificate.course_id || certificate.course?.id)),
    [certificates],
  );

  return (
    <div className="p-6 space-y-8 page-light min-h-full text-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Welcome back, {user?.first_name}!</h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s your learning progress overview.</p>
        </div>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-white">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled" value={stats?.enrolled ?? 0} icon={<BookOpen size={16}/>} color="blue" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={<CheckCircle size={16}/>} color="green" />
        <StatCard label="Assignments" value={stats?.assignments ?? 0} icon={<Trophy size={16}/>} color="yellow" />
        <StatCard label="Certificates" value={stats?.certificates ?? 0} icon={<Award size={16}/>} color="purple" />
      </div>

      <div className="flex justify-end">
        <a href="/dashboard/student/feedback" className="text-sm text-brand-600 hover:underline">Submit course feedback →</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.7fr] gap-4">
        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-950 text-sm mb-4">Progress snapshot</h2>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Completion rate</span>
              <span className="font-semibold text-slate-950">{stats?.completion_rate ?? 0}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand-400" style={{ width: `${stats?.completion_rate ?? 0}%` }} />
            </div>
          </div>
        </div>
        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <h2 className="font-bold text-slate-950 text-sm mb-4">Next steps</h2>
          <div className="space-y-2">
            {nextSteps.map((step:any) => (
              <div key={step.title} className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-3 text-sm">
                <div className="font-semibold text-slate-950">{step.title}</div>
                <div className="mt-1 text-xs text-slate-500">{step.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-bold text-slate-950 text-sm">My Courses & Applications</h2>
          <a href="/dashboard/student/courses" className="text-sm text-brand-600 hover:text-brand-500">View courses →</a>
        </div>
        <div className="space-y-3">
          {enrollments.map((e: any) => (
            <div key={e.id} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100"><BookOpen size={20} className="text-brand-500"/></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-950">{e.course?.title || "Course"}</p>
                    <p className="mt-1 text-sm text-slate-600">{e.course?.description || "Course description will be available soon."}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full px-2.5 py-1 font-semibold ${
                        ["active", "completed"].includes(e.status)
                          ? "bg-emerald-50 text-emerald-700"
                          : e.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-800"
                      }`}>
                        {["active", "completed"].includes(e.status)
                          ? "Access granted"
                          : e.status === "application_pending"
                            ? "Awaiting admin approval"
                            : e.status === "rejected"
                              ? "Application not approved"
                              : "Awaiting payment"}
                      </span>
                      {e.status === "active" && (
                        <span className="text-slate-500">Progress: {e.progress ?? 0}%</span>
                      )}
                      {e.status === "active" && (
                        <div className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${e.progress ?? 0}%` }}/>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["active", "completed"].includes(e.status) ? (
                    <a href="/dashboard/student/learning" className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600">Continue learning</a>
                  ) : e.status === "pending" ? (
                    <>
                      <PaystackButton
                        courseId={e.course_id || e.course?.id}
                        amount={Number(e.course?.price || 0)}
                        courseName={e.course?.title || "Course"}
                        mode={e.mode || e.course?.mode || "online"}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setReportingCourseId(reportingCourseId === e.id ? null : e.id);
                          setPaymentReference("");
                          setPaymentMessage("");
                        }}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                      >
                        I paid by transfer
                      </button>
                    </>
                  ) : e.status === "application_pending" ? (
                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                      Awaiting admin approval
                    </span>
                  ) : (
                    <a
                      href={`/public/courses/${e.course_id || e.course?.id}`}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View course and reapply
                    </a>
                  )}
                  {!certificateCourseIds.has(e.course_id || e.course?.id) && ["active", "completed"].includes(e.status) && (
                    <button
                      onClick={() => requestCertificateMutation.mutate(e.course_id || e.course?.id)}
                      disabled={requestCertificateMutation.isPending || !profile?.certificate_name}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >Request certificate</button>
                  )}
                </div>
              </div>
              {["application_pending", "pending", "rejected"].includes(e.status) && (() => {
                const latestPayment = latestPaymentByCourse.get(e.course_id || e.course?.id);
                return (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <LockKeyhole size={16} />
                      {e.status === "application_pending"
                        ? "Your application is waiting for admin approval. Payment and course materials are unavailable until then."
                        : e.status === "rejected"
                          ? "Your course application was not approved."
                          : latestPayment?.status === "reported"
                            ? "Payment report is waiting for admin approval"
                            : latestPayment?.status === "rejected"
                              ? "Payment report needs attention"
                              : "Course materials and certificates are locked until payment is approved"}
                    </p>
                    {e.review_message && (
                      <p className="mt-2 text-sm text-amber-900">Admin note: {e.review_message}</p>
                    )}
                    {latestPayment?.review_message && e.status === "pending" && (
                      <p className="mt-2 text-sm text-amber-900">{latestPayment.review_message}</p>
                    )}
                    {reportingCourseId === e.id && e.status === "pending" && (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          reportPaymentMutation.mutate(e.course_id || e.course?.id);
                        }}
                        className="mt-4 grid gap-3 md:grid-cols-2"
                      >
                        <label className="text-xs font-medium text-slate-700">
                          Payment reference (optional)
                          <input
                            value={paymentReference}
                            onChange={(event) => setPaymentReference(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Bank transfer reference"
                          />
                        </label>
                        <label className="text-xs font-medium text-slate-700">
                          Message for the admin team (optional)
                          <input
                            value={paymentMessage}
                            onChange={(event) => setPaymentMessage(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Payment date or transfer details"
                          />
                        </label>
                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            disabled={reportPaymentMutation.isPending || latestPayment?.status === "reported"}
                            className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                          >
                            {reportPaymentMutation.isPending ? "Sending report..." : "Send payment report"}
                          </button>
                          <p className="mt-2 text-xs text-amber-900">An admin will review your report before course access is unlocked.</p>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
          {!enrollments.length && <p className="text-slate-500 text-sm text-center py-8">No course applications yet. <a href="/public/courses" className="text-brand-600 hover:underline">Browse courses →</a></p>}
        </div>
      </div>

      <div className="page-surface rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-950">Recent certificates</h2>
          <a href="/dashboard/student/certificates" className="text-sm text-brand-600 hover:text-brand-500">View all <ArrowRight size={14} className="inline" /></a>
        </div>
        <div className="mt-4 space-y-3">
          {certificates.slice(0, 3).map((certificate: any) => (
            <div key={certificate.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-950">{certificate.certificate_number}</div>
              <div className="mt-1 text-xs text-slate-500">{certificate.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
