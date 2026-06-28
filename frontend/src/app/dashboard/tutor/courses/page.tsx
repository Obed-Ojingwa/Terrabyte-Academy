"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { BookOpen, Layers, PlayCircle, Plus, Pencil, Trash2, DownloadCloud } from "lucide-react";
import MediaUploader from "@/components/uploads/MediaUploader";

export default function TutorCoursesPage() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonForm, setLessonForm] = useState({ moduleId: "", title: "", content: "", duration_min: "" });

  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["tutor-courses"],
    queryFn: async () => (await api.get("/courses/me")).data,
  });

  const { data: modulesData, refetch: refetchModules } = useQuery({
    queryKey: ["course-modules", selectedCourseId],
    queryFn: async () => (await api.get(`/courses/${selectedCourseId}/modules`)).data,
    enabled: !!selectedCourseId,
  });

  useEffect(() => {
    if (!selectedCourseId && coursesData?.length) {
      setSelectedCourseId(coursesData[0].id);
    }
  }, [coursesData, selectedCourseId]);

  const createModuleMutation = useMutation({
    mutationFn: async ({ courseId, title }: { courseId: string; title: string }) => api.post(`/courses/${courseId}/modules`, { title, position: 0 }),
    onSuccess: () => {
      toast.success("Module created");
      setModuleTitle("");
      refetchModules();
    },
    onError: () => toast.error("Unable to create module"),
  });

  const createLessonMutation = useMutation({
    mutationFn: async ({ courseId, moduleId, title, content, duration_min }: Record<string, string>) => api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, { title, content, position: 0, duration_min: Number(duration_min || 0), is_preview: false }),
    onSuccess: () => {
      toast.success("Lesson created");
      setLessonForm({ moduleId: "", title: "", content: "", duration_min: "" });
      refetchModules();
    },
    onError: () => toast.error("Unable to create lesson"),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async ({ courseId, moduleId }: { courseId: string; moduleId: string }) => api.delete(`/courses/${courseId}/modules/${moduleId}`),
    onSuccess: () => {
      toast.success("Module removed");
      refetchModules();
    },
    onError: () => toast.error("Unable to remove module"),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async ({ courseId, moduleId, lessonId }: { courseId: string; moduleId: string; lessonId: string }) => api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
    onSuccess: () => {
      toast.success("Lesson removed");
      refetchModules();
    },
    onError: () => toast.error("Unable to remove lesson"),
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async ({ lessonId, materialId }: { lessonId: string; materialId: string }) => api.delete(`/lesson-materials/${lessonId}/${materialId}`),
    onSuccess: () => {
      toast.success("Material removed");
      refetchModules();
    },
    onError: () => toast.error("Unable to remove material"),
  });

  const courses = useMemo(() => coursesData ?? [], [coursesData]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Tutor Course Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">Create modules and lessons for your assigned courses.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Assigned courses</h2>
          </div>
          {loadingCourses ? <p className="text-sm text-slate-500">Loading courses...</p> : (
            <div className="space-y-3">
              {courses.map((course: any) => (
                <button key={course.id} onClick={() => setSelectedCourseId(course.id)} className={`w-full rounded-2xl border p-3 text-left ${selectedCourseId === course.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-slate-50"}`}>
                  <div className="font-semibold text-slate-950">{course.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{course.category || "General"} • {course.mode}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Layers size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Modules & lessons</h2>
          </div>
          {!selectedCourseId ? <p className="text-sm text-slate-500">Select a course to view its content.</p> : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-900">Add module</div>
                <div className="mt-2 flex gap-2">
                  <input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Module title" />
                  <button onClick={() => selectedCourseId && createModuleMutation.mutate({ courseId: selectedCourseId, title: moduleTitle })} className="flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
                    <Plus size={15} /> Add
                  </button>
                </div>
              </div>

              {(modulesData ?? []).map((module: any) => (
                <div key={module.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-950">{module.title}</div>
                    <button onClick={() => selectedCourseId && deleteModuleMutation.mutate({ courseId: selectedCourseId, moduleId: module.id })} className="text-xs text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(module.lessons ?? []).map((lesson: any) => (
                      <div key={lesson.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <PlayCircle size={14} className="text-brand-400" />
                            <span>{lesson.title}</span>
                          </div>
                          <button onClick={() => selectedCourseId && deleteLessonMutation.mutate({ courseId: selectedCourseId, moduleId: module.id, lessonId: lesson.id })} className="text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="mt-3 space-y-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-500">
                              <span>Materials</span>
                              <span>{lesson.materials?.length ?? 0} files</span>
                            </div>
                            {(lesson.materials ?? []).length ? (
                              <div className="space-y-2">
                                {lesson.materials.map((material: any) => (
                                  <div key={material.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                    <a href={material.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand-600 hover:text-brand-800">
                                      <DownloadCloud size={14} />
                                      <span>{material.title}</span>
                                    </a>
                                    <button onClick={() => deleteMaterialMutation.mutate({ lessonId: lesson.id, materialId: material.id })} className="text-red-600 text-xs">
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No lesson materials yet.</p>
                            )}
                          </div>
                          <MediaUploader
                            label="Upload lesson material"
                            accept="*/*"
                            uploadUrl={`/lesson-materials/${lesson.id}`}
                            extraFormFields={{ title: lesson.title, is_downloadable: "true" }}
                            onUploaded={() => refetchModules()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white p-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add lesson</div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input value={lessonForm.moduleId === module.id ? lessonForm.title : ""} onChange={(e) => setLessonForm({ ...lessonForm, moduleId: module.id, title: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Lesson title" />
                      <input value={lessonForm.moduleId === module.id ? lessonForm.duration_min : ""} onChange={(e) => setLessonForm({ ...lessonForm, moduleId: module.id, duration_min: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Duration (min)" type="number" />
                    </div>
                    <textarea value={lessonForm.moduleId === module.id ? lessonForm.content : ""} onChange={(e) => setLessonForm({ ...lessonForm, moduleId: module.id, content: e.target.value })} className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Lesson content" />
                    <button onClick={() => selectedCourseId && lessonForm.moduleId === module.id && createLessonMutation.mutate({ courseId: selectedCourseId, moduleId: module.id, title: lessonForm.title, content: lessonForm.content, duration_min: lessonForm.duration_min })} className="mt-2 flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                      <Plus size={15} /> Save lesson
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
