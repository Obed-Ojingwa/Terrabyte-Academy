"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";

type AdminCourse = {
  id: string;
  title?: string;
  description?: string;
  price?: number | string;
  mode?: string;
  category?: string;
  level?: string;
  duration_weeks?: number | string;
  tutor?: { id?: string };
  is_published?: boolean;
};

type CourseFormState = {
  title: string;
  description: string;
  price: string;
  mode: string;
  category: string;
  level: string;
  duration_weeks: string;
  tutor_id: string;
  is_published: boolean;
};

const emptyForm = (): CourseFormState => ({
  title: "",
  description: "",
  price: "0",
  mode: "online",
  category: "",
  level: "beginner",
  duration_weeks: "4",
  tutor_id: "",
  is_published: false,
});

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CourseFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await api.get("/courses")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => api.post("/courses", payload),
    onSuccess: () => {
      toast.success("Course created");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setForm(emptyForm());
    },
    onError: () => toast.error("Unable to create course"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => api.put(`/courses/${id}`, payload),
    onSuccess: () => {
      toast.success("Course updated");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: () => toast.error("Unable to update course"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: () => toast.error("Unable to delete course"),
  });

  const courses = useMemo(() => data?.items ?? [], [data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || null,
      price: Number(form.price || 0),
      mode: form.mode,
      category: form.category || null,
      level: form.level || null,
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      tutor_id: form.tutor_id || null,
      is_published: form.is_published,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (course: AdminCourse) => {
    setEditingId(String(course.id));
    setForm({
      title: String(course.title ?? ""),
      description: String(course.description ?? ""),
      price: String(course.price ?? 0),
      mode: String(course.mode ?? "online"),
      category: String(course.category ?? ""),
      level: String(course.level ?? "beginner"),
      duration_weeks: String(course.duration_weeks ?? 4),
      tutor_id: String(course.tutor?.id ?? ""),
      is_published: Boolean(course.is_published),
    });
  };

  return (
    <div className="min-h-full bg-[#03091A] p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Course Management</h1>
          <p className="mt-1 text-sm text-white/40">Create, edit, publish, and remove courses.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#071428] px-4 py-3 text-sm text-white/60">
          <span className="font-semibold text-white">{courses.length}</span> courses
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">{editingId ? "Edit course" : "Create course"}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Course title" required />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Price" type="number" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Category" />
            <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Level" />
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Duration weeks" type="number" />
            <input value={form.tutor_id} onChange={(e) => setForm({ ...form, tutor_id: e.target.value })} className="rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Tutor ID" />
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Published
            </label>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-4 min-h-[120px] w-full rounded-xl border border-white/10 bg-[#03091A] px-3 py-2 text-sm" placeholder="Description" />
          <div className="mt-5 flex gap-3">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">
              <Plus size={16} /> {editingId ? "Save changes" : "Create course"}
            </button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm">Cancel</button>}
          </div>
        </form>

        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <h2 className="mb-4 text-lg font-semibold">Existing courses</h2>
          {isLoading ? <p className="text-sm text-white/40">Loading...</p> : (
            <div className="space-y-3">
              {courses.map((course: AdminCourse) => (
                <div key={course.id} className="rounded-2xl border border-white/10 bg-[#03091A] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{course.title}</div>
                      <div className="mt-1 text-xs text-white/40">{course.category || "General"} • {course.mode}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${course.is_published ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => startEdit(course)} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/70">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => deleteMutation.mutate(course.id)} className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-300">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
