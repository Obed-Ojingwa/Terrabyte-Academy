"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BookOpen, Layers, PlayCircle } from "lucide-react";

export default function StudentCoursesPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { data: coursesData } = useQuery({ queryKey: ["student-courses"], queryFn: async () => (await api.get("/courses")).data });
  const courses = useMemo(() => coursesData?.items ?? [], [coursesData]);
  const selectedCourse = courses.find((course: any) => course.id === selectedCourseId) ?? courses[0] ?? null;

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-black">My Courses</h1>
        <p className="mt-1 text-sm text-slate-500">Explore your enrolled courses and lesson structure.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <BookOpen size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Course list</h2>
          </div>
          <div className="space-y-3">
            {courses.map((course: any) => (
              <button key={course.id} onClick={() => setSelectedCourseId(course.id)} className={`w-full rounded-2xl border px-4 py-4 text-left ${selectedCourseId === course.id ? "border-brand-500 bg-brand-500/10" : "border-slate-200 bg-slate-50"}`}>
                <div className="font-semibold text-slate-950">{course.title}</div>
                <div className="mt-1 text-xs text-slate-500">{course.category || "General"} • {course.mode}</div>
              </button>
            ))}
            {!courses.length && <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No courses found yet.</div>}
          </div>
        </div>

        <div className="page-surface rounded-3xl p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <Layers size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Course details</h2>
          </div>
          {!selectedCourse ? (
            <p className="text-slate-500">Select a course to view its lessons and progress.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-950">{selectedCourse.title}</div>
                <p className="mt-2 text-sm text-slate-500">{selectedCourse.description || "No course description available."}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-950 mb-3">Lessons</div>
                <div className="space-y-2">
                  {(selectedCourse.modules ?? []).map((module: any) => (
                    <div key={module.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="font-semibold text-slate-950">{module.title}</div>
                      <div className="mt-2 space-y-2">
                        {(module.lessons ?? []).map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                            <PlayCircle size={14} className="text-brand-500" />
                            <span>{lesson.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!selectedCourse.modules?.length && <p className="text-sm text-slate-500">No lessons are available for this course.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
