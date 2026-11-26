"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

type Application = {
  id: string;
  status: string;
  enrolled_at: string;
  student?: { first_name: string; last_name: string };
  course?: { title: string; price: number; description?: string };
};

export default function CourseApplicationsPage() {
  const queryClient = useQueryClient();
  const [reviewMessages, setReviewMessages] = useState<Record<string, string>>({});
  const { data: applications = [], isLoading, isError, refetch, isFetching } = useQuery<Application[]>({
    queryKey: ["admin-course-applications"],
    queryFn: async () => (await api.get("/enrollments/applications/pending")).data,
    refetchInterval: 15_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      (await api.post(`/enrollments/${id}/review`, {
        decision,
        message: reviewMessages[id]?.trim() || undefined,
      })).data,
    onSuccess: async (result) => {
      toast.success(result.status === "active"
        ? "Application approved and student enrolled."
        : result.status === "pending"
          ? "Application approved. The student can now pay."
          : "Application rejected.");
      await queryClient.invalidateQueries({ queryKey: ["admin-course-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || "Unable to review application"),
  });

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Course applications</h1>
          <p className="mt-1 text-sm text-slate-500">Review student applications before enrollment or payment.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading applications...</p>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-700">Unable to load course applications.</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-brand-700">Try again</button>
          </div>
        ) : applications.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">There are no applications awaiting review.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.map((application) => (
              <article key={application.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-950">{application.course?.title || "Course"}</h2>
                    <p className="mt-1 text-sm text-slate-700">
                      {application.student?.first_name} {application.student?.last_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Applied {new Date(application.enrolled_at).toLocaleString("en-NG")}
                    </p>
                    {application.course?.description && (
                      <p className="mt-3 max-w-3xl text-sm text-slate-600">{application.course.description}</p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {Number(application.course?.price || 0) > 0
                        ? `₦${Number(application.course?.price).toLocaleString("en-NG")} · payment required after approval`
                        : "Free course · enrollment activates after approval"}
                    </p>
                    <label className="mt-4 block max-w-xl text-xs font-medium text-slate-600">
                      Optional message to the applicant (used if rejected)
                      <textarea
                        value={reviewMessages[application.id] || ""}
                        onChange={(event) => setReviewMessages((current) => ({
                          ...current,
                          [application.id]: event.target.value,
                        }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                        rows={2}
                      />
                    </label>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => reviewMutation.mutate({ id: application.id, decision: "approve" })}
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewMutation.mutate({ id: application.id, decision: "reject" })}
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
