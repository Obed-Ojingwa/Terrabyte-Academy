"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, BookOpen, FileText, Users } from "lucide-react";
import MediaUploader from "@/components/uploads/MediaUploader";
import { CourseMaterialResponse, StudentCourseProgress } from "@/types/course";

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await api.get("/courses")).data,
  });

  const courseMaterialsQuery = useQuery<CourseMaterialResponse[]>({
    queryKey: ["admin-course-materials", selectedCourseId],
    queryFn: async () => (await api.get(`/admin/courses/${selectedCourseId}/materials`)).data,
    enabled: !!selectedCourseId,
  });

  const courseStudentProgressQuery = useQuery<StudentCourseProgress[]>({
    queryKey: ["admin-course-students-progress", selectedCourseId],
    queryFn: async () => (await api.get(`/admin/courses/${selectedCourseId}/students/progress`)).data,
    enabled: !!selectedCourseId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => api.post("/courses", payload),
    onSuccess: () => {
      toast.success("Course created");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setForm(emptyForm());
      setThumbnailUrl("");
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
      setThumbnailUrl("");
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

  const assignTutorMutation = useMutation({
    mutationFn: async ({ courseId, tutorId }: { courseId: string; tutorId: string | null }) =>
      api.put(`/admin/courses/${courseId}/tutor`, { tutor_id: tutorId }),
    onSuccess: () => {
      toast.success("Tutor assignment updated");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      if (selectedCourseId) {
        queryClient.invalidateQueries({ queryKey: ["admin-course-students-progress", selectedCourseId] });
      }
    },
    onError: () => toast.error("Unable to assign tutor"),
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
      thumbnail_url: thumbnailUrl || null,
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

  const selectCourse = (course: AdminCourse) => {
    setSelectedCourseId(course.id);
    setSelectedTutorId(course.tutor?.id ?? "");
  };

  const selectedCourse = useMemo(
    () => courses.find((course: AdminCourse) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Course Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create, edit, publish, and remove courses.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{courses.length}</span> courses
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={submit} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">{editingId ? "Edit course" : "Create course"}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Course title" required />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Price" type="number" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Category" />
            <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Level" />
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Duration weeks" type="number" />
            <input value={form.tutor_id} onChange={(e) => setForm({ ...form, tutor_id: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Tutor ID" />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Published
            </label>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950" placeholder="Description" />
          <div className="mt-4">
            <MediaUploader label="Course thumbnail" accept="image/*" onUploaded={(url) => setThumbnailUrl(url)} />
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">
              <Plus size={16} /> {editingId ? "Save changes" : "Create course"}
            </button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700">Cancel</button>}
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Existing courses</h2>
          {isLoading ? <p className="text-sm text-slate-500">Loading...</p> : (
            <div className="space-y-3">
              {courses.map((course: AdminCourse) => (
                <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{course.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{course.category || "General"} • {course.mode}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${course.is_published ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-amber-600"}`}>
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => startEdit(course)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => deleteMutation.mutate(course.id)} className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50">
                      <Trash2 size={13} /> Delete
                    </button>
                    <button onClick={() => selectCourse(course)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                      <Users size={13} /> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm mt-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Selected course details</h2>
            <p className="text-sm text-slate-500">View tutor assignment, materials, and student progress.</p>
          </div>
          <span className="rounded-2xl bg-slate-100 px-3 py-1 text-sm text-slate-600">{selectedCourse ? selectedCourse.title : "No course selected"}</span>
        </div>
        {!selectedCourse ? (
          <p className="text-sm text-slate-500">Choose a course from the list to inspect its materials, assign a tutor, or review student progress.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Course</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCourse.title}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedCourse.category || "Category not set"} • {selectedCourse.mode}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Current tutor</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCourse.tutor?.id ?? "Unassigned"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCourse.is_published ? "Published" : "Draft"}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="block text-sm font-semibold text-slate-700">Assign tutor by ID</label>
                <input
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"
                  placeholder="Tutor ID"
                />
                <button
                  type="button"
                  onClick={() => selectedCourseId && assignTutorMutation.mutate({ courseId: selectedCourseId, tutorId: selectedTutorId || null })}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  <FileText size={16} /> Assign tutor
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">Latest queries</p>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => courseMaterialsQuery.refetch()}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    View course materials
                  </button>
                  <button
                    onClick={() => courseStudentProgressQuery.refetch()}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    View student progress
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-950">Course materials</h3>
                  <span className="text-xs text-slate-500">{courseMaterialsQuery.isFetching ? "Refreshing..." : ""}</span>
                </div>
                {courseMaterialsQuery.isLoading ? (
                  <p className="text-sm text-slate-500">Loading materials...</p>
                ) : courseMaterialsQuery.data?.length ? (
                  <div className="space-y-4">
                    {courseMaterialsQuery.data.map((item) => (
                      <div key={item.lesson_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="font-semibold text-slate-950">{item.lesson_title}</div>
                        <div className="mt-3 space-y-2">
                          {item.materials.map((material) => (
                            <div key={material.id} className="grid gap-2 sm:grid-cols-[1fr_auto] items-center rounded-xl border border-slate-200 bg-white p-3">
                              <div>
                                <div className="font-medium text-slate-950">{material.title}</div>
                                <div className="text-xs text-slate-500">{material.type} • {material.size_bytes ? `${(material.size_bytes / 1024).toFixed(1)} KB` : "Unknown size"}</div>
                              </div>
                              <a href={material.url} target="_blank" rel="noreferrer" className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white">
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No materials found for this course.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-950">Student progress</h3>
                  <span className="text-xs text-slate-500">{courseStudentProgressQuery.isFetching ? "Refreshing..." : ""}</span>
                </div>
                {courseStudentProgressQuery.isLoading ? (
                  <p className="text-sm text-slate-500">Loading progress...</p>
                ) : courseStudentProgressQuery.data?.length ? (
                  <div className="space-y-3">
                    {courseStudentProgressQuery.data.map((item) => (
                      <div key={item.student_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-950">{item.student_name}</div>
                            <div className="text-xs text-slate-500">{item.enrollment_status}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-950">{item.progress_percent}%</div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{item.lessons_completed}/{item.total_lessons} lessons completed</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No student progress found for this course.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
