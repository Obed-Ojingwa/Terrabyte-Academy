"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { ClipboardList, Plus } from "lucide-react";

export default function TutorAssignmentsPage() {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");

  const { data: coursesData } = useQuery({ queryKey: ["tutor-assignment-courses"], queryFn: async () => (await api.get("/courses")).data });
  const { data: assignmentsData } = useQuery({ queryKey: ["tutor-assignments", courseId], queryFn: async () => (await api.get("/assignments", { params: { course_id: courseId || undefined } })).data, enabled: !!courseId || courseId === "" });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/assignments", { course_id: courseId, title, due_date: dueDate || null, max_score: Number(maxScore || 100) }),
    onSuccess: () => {
      toast.success("Assignment created");
      queryClient.invalidateQueries({ queryKey: ["tutor-assignments", courseId] });
      setTitle("");
      setDueDate("");
      setMaxScore("100");
    },
    onError: () => toast.error("Unable to create assignment"),
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const courses = useMemo(() => coursesData?.items ?? [], [coursesData]);
  const assignments = useMemo(() => assignmentsData ?? [], [assignmentsData]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Assignment Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">Create and review assignment briefs for your courses.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleCreateAssignment} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Create assignment</h2>
          </div>
          <div className="space-y-3">
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" required>
              <option value="">Select course</option>
              {courses.map((course: any) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Assignment title" required />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" />
            <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Max score" />
            <button type="submit" disabled={!courseId || !title} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${!courseId || !title ? "bg-slate-300 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600"}`}>
              <Plus size={16} /> Create assignment
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Existing assignments</h2>
          <div className="space-y-3">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="font-semibold text-slate-950">{assignment.title}</div>
                <div className="mt-1 text-xs text-slate-500">Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No due date"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
