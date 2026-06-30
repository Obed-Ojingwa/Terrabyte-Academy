"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";

export default function FeedbackPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(5);
  const [comments, setComments] = useState<string>("");

  const { data: enrollments = [] } = useQuery({ queryKey: ["my-enrollments"], queryFn: async () => (await api.get("/enrollments")).data });

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => (await api.post("/student/feedback", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast.success("Feedback submitted — thank you!");
      setComments("");
      setRating(5);
    },
    onError: () => toast.error("Unable to submit feedback"),
  });

  const handleSubmit = () => {
    const payload: any = {};
    if (courseId) payload.course_id = courseId;
    if (tutorId) payload.tutor_id = tutorId;
    if (rating) payload.rating = rating;
    if (comments) payload.comments = comments;
    submitMutation.mutate(payload);
  };

  return (
    <div className="page-light min-h-full p-6 text-slate-950">
      <div className="mb-4">
        <h1 className="text-2xl font-black">Submit Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">Share your course experience and help us improve.</p>
      </div>

      <div className="max-w-2xl space-y-4">
        <div>
          <label className="text-sm mb-1 block">Course</label>
          <select value={courseId ?? ""} onChange={(e) => setCourseId(e.target.value || null)} className="w-full rounded-xl border px-3 py-2">
            <option value="">— Select course (optional)</option>
            {enrollments.map((en: any) => (
              <option key={en.id} value={en.course_id}>{en.course?.title ?? "Course"}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm mb-1 block">Tutor</label>
          <input value={tutorId ?? ""} onChange={(e) => setTutorId(e.target.value || null)} placeholder="Tutor id (optional)" className="w-full rounded-xl border px-3 py-2" />
        </div>

        <div>
          <label className="text-sm mb-1 block">Rating</label>
          <select value={rating ?? 5} onChange={(e) => setRating(Number(e.target.value))} className="w-32 rounded-xl border px-3 py-2">
            {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} ★</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm mb-1 block">Comments</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={6} className="w-full rounded-xl border px-3 py-2" />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSubmit} disabled={submitMutation.isLoading} className="rounded-xl bg-brand-500 px-4 py-2 text-white">Submit feedback</button>
        </div>
      </div>
    </div>
  );
}
