"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { CheckSquare, MessageSquareText } from "lucide-react";

export default function TutorSubmissionsPage() {
  const qc = useQueryClient();
  const [assignmentId, setAssignmentId] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data: assignmentsData } = useQuery({ queryKey: ["tutor-assignments-review"], queryFn: async () => (await api.get("/assignments")).data });
  const { data: submissionsData } = useQuery({ queryKey: ["tutor-submissions", assignmentId], queryFn: async () => (await api.get(`/assignments/${assignmentId}`)).data, enabled: !!assignmentId });

  const reviewMutation = useMutation({
    mutationFn: async () => api.put(`/assignments/${assignmentId}/submissions/${submissionId}`, { score: Number(score), feedback, status: "graded" }),
    onSuccess: () => {
      toast.success("Submission reviewed");
      qc.invalidateQueries({ queryKey: ["tutor-submissions"] });
      setScore("");
      setFeedback("");
    },
    onError: () => toast.error("Unable to review submission"),
  });

  const assignments = useMemo(() => assignmentsData ?? [], [assignmentsData]);
  const submissions = useMemo(() => submissionsData?.submissions ?? [], [submissionsData]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Submission Review</h1>
        <p className="mt-1 text-sm text-white/40">Review student submissions and leave feedback.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2"><CheckSquare size={18} className="text-brand-400" /><h2 className="text-lg font-semibold">Select assignment</h2></div>
          <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm">
            <option value="">Choose assignment</option>
            {assignments.map((assignment: any) => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}
          </select>
          {assignmentId && (
            <div className="mt-4 space-y-3">
              {submissions.map((submission: any) => (
                <button key={submission.id} onClick={() => setSubmissionId(submission.id)} className={`w-full rounded-2xl border p-3 text-left ${submissionId === submission.id ? "border-brand-500 bg-brand-500/10" : "border-white/10 bg-[#03091A]"}`}>
                  <div className="font-semibold">Submission #{submission.id.slice(0, 8)}</div>
                  <div className="mt-1 text-xs text-white/40">Status: {submission.status}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2"><MessageSquareText size={18} className="text-brand-400" /><h2 className="text-lg font-semibold">Review details</h2></div>
          {!submissionId ? <p className="text-sm text-white/40">Choose a submission to grade.</p> : (
            <div className="space-y-3">
              <input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" className="w-full rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" />
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5} placeholder="Feedback" className="w-full rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" />
              <button onClick={() => reviewMutation.mutate()} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Submit review</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
