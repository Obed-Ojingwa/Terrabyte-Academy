"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BookOpen, ClipboardList, Trophy } from "lucide-react";

export default function StudentLearningPage() {
  const { data: enrollmentsData } = useQuery({ queryKey: ["my-enrollments"], queryFn: async () => (await api.get("/enrollments/")).data });
  const { data: assignmentsData } = useQuery({ queryKey: ["student-assignments"], queryFn: async () => (await api.get("/assignments")).data });
  const { data: examsData } = useQuery({ queryKey: ["student-exams"], queryFn: async () => (await api.get("/exams")).data });

  const enrollments = useMemo(() => enrollmentsData?.items ?? [], [enrollmentsData]);
  const assignments = useMemo(() => assignmentsData ?? [], [assignmentsData]);
  const exams = useMemo(() => examsData ?? [], [examsData]);

  return (
    <div className="min-h-full bg-[#03091A] p-6 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Learning Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">Track your enrolled courses, assignments, and exams.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2"><BookOpen size={18} className="text-brand-400" /><h2 className="text-lg font-semibold">My Courses</h2></div>
          <div className="space-y-3">
            {enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="rounded-2xl border border-white/10 bg-[#03091A] p-3 text-sm">
                <div className="font-semibold">{enrollment.course?.title ?? "Course"}</div>
                <div className="mt-1 text-xs text-white/40">Status: {enrollment.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-brand-400" /><h2 className="text-lg font-semibold">Assignments</h2></div>
          <div className="space-y-3">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="rounded-2xl border border-white/10 bg-[#03091A] p-3 text-sm">
                <div className="font-semibold">{assignment.title}</div>
                <div className="mt-1 text-xs text-white/40">Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No date"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2"><Trophy size={18} className="text-brand-400" /><h2 className="text-lg font-semibold">Exams</h2></div>
          <div className="space-y-3">
            {exams.map((exam: any) => (
              <div key={exam.id} className="rounded-2xl border border-white/10 bg-[#03091A] p-3 text-sm">
                <div className="font-semibold">{exam.title}</div>
                <div className="mt-1 text-xs text-white/40">{exam.duration_min} min • Pass {exam.pass_score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
