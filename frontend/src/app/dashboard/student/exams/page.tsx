"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Activity, Clock } from "lucide-react";

export default function StudentExamsPage() {
  const { data: examsData = [] } = useQuery({ queryKey: ["student-exams"], queryFn: async () => (await api.get("/exams")).data });
  const exams = useMemo(() => examsData ?? [], [examsData]);

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
                <div className="font-semibold text-slate-950">Starts</div>
                <div className="mt-1">{exam.start_date ? new Date(exam.start_date).toLocaleDateString() : "TBD"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">Ends</div>
                <div className="mt-1">{exam.end_date ? new Date(exam.end_date).toLocaleDateString() : "TBD"}</div>
              </div>
            </div>
          </div>
        ))}
        {!exams.length && <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No exams available yet.</div>}
      </div>
    </div>
  );
}
