"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { FileText } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentAssignmentsPage() {
  const qc = useQueryClient();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { data: assignmentsData = [] } = useQuery({ queryKey: ["student-assignments"], queryFn: async () => (await api.get("/assignments")).data });
  const assignments = useMemo(() => assignmentsData ?? [], [assignmentsData]);
  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, text_response }: { assignmentId: string; text_response: string }) =>
      api.post(`/assignments/${assignmentId}/submissions`, { text_response }),
    onSuccess: () => {
      toast.success("Assignment submitted");
      qc.invalidateQueries({ queryKey: ["student-assignments"] });
    },
    onError: () => toast.error("Unable to submit assignment"),
  });

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Assignments</h1>
        <p className="mt-1 text-sm text-slate-500">Review due tasks, submission status, and grading updates.</p>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment: any) => (
          <div key={assignment.id} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-950">
                  <FileText size={18} className="text-brand-500" />
                  <h2 className="text-lg font-semibold">{assignment.title}</h2>
                </div>
                <p className="mt-2 text-sm text-slate-500">{assignment.course?.title ?? "Course assignment"}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-950">Due</div>
                <div className="text-sm text-slate-500">{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "TBD"}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Status</div>
                <div className="mt-1">{assignment.status ?? "Pending"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Grade</div>
                <div className="mt-1">{assignment.grade ?? "Not graded"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Submitted</div>
                <div className="mt-1">{assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleDateString() : "No"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <textarea
                value={responses[assignment.id] ?? assignment.submissions?.[0]?.text_response ?? ""}
                onChange={(e) => setResponses((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-950"
                placeholder="Provide your answer or attach a link here..."
                rows={4}
              />
              <button
                onClick={() =>
                  submitAssignmentMutation.mutate({
                    assignmentId: assignment.id,
                    text_response: responses[assignment.id] ?? assignment.submissions?.[0]?.text_response ?? "",
                  })
                }
                className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
              >
                {assignment.submissions?.[0] ? "Update submission" : "Submit assignment"}
              </button>
            </div>
          </div>
        ))}
        {!assignments.length && <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No assignments found yet.</div>}
      </div>
    </div>
  );
}
