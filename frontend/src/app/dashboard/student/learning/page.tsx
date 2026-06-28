"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { BookOpen, ClipboardList, Trophy, CheckCircle2, Clock3 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentLearningPage() {
  const qc = useQueryClient();
  const [selectedEnrollment, setSelectedEnrollment] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});

  const { data: enrollmentsData } = useQuery({ queryKey: ["my-enrollments"], queryFn: async () => (await api.get("/enrollments")).data });
  const { data: assignmentsData } = useQuery({ queryKey: ["student-assignments"], queryFn: async () => (await api.get("/assignments")).data });
  const { data: examsData } = useQuery({ queryKey: ["student-exams"], queryFn: async () => (await api.get("/exams")).data });

  const progressMutation = useMutation({
    mutationFn: async ({ enrollmentId, lessonId }: { enrollmentId: string; lessonId: string }) => api.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/progress`, { lesson_id: lessonId, is_completed: true, watch_time_sec: 300 }),
    onSuccess: () => {
      toast.success("Lesson marked complete");
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: () => toast.error("Unable to update progress"),
  });

  const enrollments = useMemo(() => enrollmentsData ?? [], [enrollmentsData]);
  const assignments = useMemo(() => {
    const courseId = selectedEnrollment ? enrollments.find((enrollment: any) => enrollment.id === selectedEnrollment)?.course_id : null;
    return (assignmentsData ?? []).filter((assignment: any) => !courseId || assignment.course_id === courseId || assignment.course?.id === courseId);
  }, [assignmentsData, enrollments, selectedEnrollment]);
  const exams = useMemo(() => {
    const courseId = selectedEnrollment ? enrollments.find((enrollment: any) => enrollment.id === selectedEnrollment)?.course_id : null;
    return (examsData ?? []).filter((exam: any) => !courseId || exam.course_id === courseId || exam.course?.id === courseId);
  }, [examsData, enrollments, selectedEnrollment]);

  const selectedCourse = enrollments.find((enrollment: any) => enrollment.id === selectedEnrollment) ?? enrollments[0];
  const courseModules = useMemo(() => selectedCourse?.course?.modules ?? [], [selectedCourse]);
  const lessonProgress = useMemo(() => {
    const lessons = courseModules.flatMap((module: any) => (module.lessons ?? []).map((lesson: any) => lesson));
    const completed = lessons.filter((lesson: any) => lesson.is_completed).length;
    const total = lessons.length;
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [courseModules]);
  const selectedLessonData = useMemo(() => {
    return courseModules.flatMap((module: any) => (module.lessons ?? []).map((lesson: any) => ({ ...lesson, moduleTitle: module.title }))).find((lesson: any) => lesson.id === selectedLesson) ?? null;
  }, [courseModules, selectedLesson]);

  useEffect(() => {
    if (!selectedCourse || !courseModules.length) {
      setSelectedLesson(null);
      return;
    }
    const firstLesson = courseModules[0]?.lessons?.[0];
    if (firstLesson && selectedLesson !== firstLesson.id) {
      setSelectedLesson(firstLesson.id);
    }
  }, [courseModules, selectedCourse, selectedLesson]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Learning Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Track your enrolled courses, assignments, exams, and lesson progress.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><BookOpen size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-slate-950">My Courses</h2></div>
          <div className="space-y-3">
            {enrollments.map((enrollment: any) => (
              <button key={enrollment.id} onClick={() => { setSelectedEnrollment(enrollment.id); setSelectedLesson(null); }} className={`w-full rounded-2xl border px-3 py-4 text-left ${selectedCourse?.id === enrollment.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-slate-50"}`}>
                <div className="font-semibold text-slate-950">{enrollment.course?.title ?? "Course"}</div>
                <div className="mt-1 text-xs text-slate-500">Status: {enrollment.status}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><ClipboardList size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-slate-950">Assignments</h2></div>
          <div className="space-y-3">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-slate-950">{assignment.title}</div>
                <div className="mt-1 text-xs text-slate-500">Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No date"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Trophy size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-slate-950">Exams</h2></div>
          <div className="space-y-3">
            {exams.map((exam: any) => (
              <div key={exam.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-slate-950">{exam.title}</div>
                <div className="mt-1 text-xs text-slate-500">{exam.duration_min} min • Pass {exam.pass_score}</div>
                <div className="mt-3 flex items-center gap-2">
                  <input value={examAnswers[exam.id] ?? ""} onChange={(e) => setExamAnswers((prev) => ({ ...prev, [exam.id]: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" placeholder="Answer" />
                  <button onClick={() => toast.success("Exam answer saved")} className="rounded-xl border border-brand-500/20 bg-brand-50 px-3 py-2 text-xs text-brand-700">Save</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-surface rounded-3xl p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-400" /><h2 className="text-lg font-semibold text-slate-950">Lesson progress</h2></div>
        {selectedCourse ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-950">{selectedCourse.course?.title ?? "Current course"}</div>
                  <div className="mt-1 text-sm text-slate-500">{lessonProgress.completed}/{lessonProgress.total} lessons completed</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-brand-600">{lessonProgress.percent}%</div>
                  <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${lessonProgress.percent}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-2">
                {courseModules.map((module: any) => (
                  <div key={module.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="font-semibold text-slate-950">{module.title}</div>
                    <div className="mt-2 space-y-2">
                      {(module.lessons ?? []).map((lesson: any) => (
                        <button key={lesson.id} onClick={() => setSelectedLesson(lesson.id)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${selectedLesson === lesson.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-white"}`}>
                          <span className="text-slate-950">{lesson.title}</span>
                          <span className={`text-xs ${lesson.is_completed ? "text-emerald-600" : "text-slate-500"}`}>{lesson.is_completed ? "Completed" : "Pending"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!courseModules.length && <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No module breakdown is available yet for this course.</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">Selected lesson</div>
                {selectedLessonData ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="text-sm text-slate-500">{selectedLessonData.moduleTitle}</div>
                      <div className="mt-1 text-lg font-semibold text-slate-950">{selectedLessonData.title}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 size={12} />
                      <span>{selectedLessonData.duration_min ? `${selectedLessonData.duration_min} min` : "Flexible timing"}</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedLessonData.content || "Lesson content will appear here when the tutor adds it to the course."}
                    </div>
                    {selectedLessonData.materials?.length ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-950">
                          <span>Lesson materials</span>
                          <span className="text-xs text-slate-500">{selectedLessonData.materials.length} file(s)</span>
                        </div>
                        <div className="space-y-2">
                          {selectedLessonData.materials.map((material: any) => (
                            <a key={material.id} href={material.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 hover:bg-slate-50">
                              <div>
                                <div className="font-semibold text-slate-950">{material.title}</div>
                                <div className="mt-1 text-xs text-slate-500">{material.type} • {material.size_bytes ? `${Math.round(material.size_bytes / 1024)} KB` : "Size unknown"}</div>
                              </div>
                              <span className="text-brand-600">View</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <button onClick={() => progressMutation.mutate({ enrollmentId: selectedCourse.id, lessonId: selectedLessonData.id })} disabled={progressMutation.isPending} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300">
                      {selectedLessonData.is_completed ? "Revisit lesson" : "Complete lesson"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-500">Choose a lesson to review its details.</div>
                )}
              </div>
            </div>
          </div>
        ) : <p className="text-sm text-slate-500">Select a course to manage lesson progress.</p>}
      </div>
    </div>
  );
}
