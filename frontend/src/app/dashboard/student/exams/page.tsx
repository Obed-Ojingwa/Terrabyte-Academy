"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Activity, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentExamsPage() {
  const qc = useQueryClient();
  const [examAnswers, setExamAnswers] = useState<Record<string, Record<string, string>>>({});
  const { data: examsData = [] } = useQuery({ queryKey: ["student-exams"], queryFn: async () => (await api.get("/exams")).data });
  const exams = useMemo(() => examsData ?? [], [examsData]);
  const submitExamMutation = useMutation({
    mutationFn: async ({ examId, answers }: { examId: string; answers: Record<string, string> }) =>
      api.post(`/exams/${examId}/results`, { answers }),
    onSuccess: () => {
      toast.success("Exam submitted");
      qc.invalidateQueries({ queryKey: ["student-exams"] });
    },
    onError: () => toast.error("Unable to submit exam"),
  });

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Exams</h1>
        <p className="mt-1 text-sm text-slate-500">View upcoming exams, time limits, and performance criteria.</p>
      </div>

      <div className="space-y-4">
        {exams.map((exam: any) => (
          <div key={exam.id} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-950">
                  <Activity size={18} className="text-brand-500" />
                  <h2 className="text-lg font-semibold">{exam.title}</h2>
                </div>
                <p className="mt-2 text-sm text-slate-500">{exam.description || "Scheduled exam details"}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-950">Duration</div>
                <div className="text-sm text-slate-500">{exam.duration_min} min</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Pass score</div>
                <div className="mt-1">{exam.pass_score ?? "TBD"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Duration</div>
                <div className="mt-1">{exam.duration_min} min</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Questions</div>
                <div className="mt-1">{exam.questions?.length ?? 0}</div>
              </div>
            </div>
            {(exam.questions ?? []).length > 0 ? (
              <div className="mt-4 space-y-3">
                {exam.questions.map((question: any) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <div className="font-semibold text-slate-950">Question {question.position + 1}</div>
                    <div className="mt-2 text-sm text-slate-700">{question.question}</div>
                    <textarea
                      value={examAnswers[exam.id]?.[question.id] ?? ""}
                      onChange={(e) =>
                        setExamAnswers((prev) => ({
                          ...prev,
                          [exam.id]: {
                            ...(prev[exam.id] ?? {}),
                            [question.id]: e.target.value,
                          },
                        }))
                      }
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"
                      rows={3}
                      placeholder="Your answer"
                    />
                  </div>
                ))}
                <button
                  onClick={() => submitExamMutation.mutate({ examId: exam.id, answers: examAnswers[exam.id] ?? {} })}
                  className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Submit exam
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No questions have been added to this exam yet.</div>
            )}
          </div>
        ))}
        {!exams.length && <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No exams available yet.</div>}
      </div>
    </div>
  );
}
