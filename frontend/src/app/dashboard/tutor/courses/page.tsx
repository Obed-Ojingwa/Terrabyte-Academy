"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BookOpen, Layers, PlayCircle } from "lucide-react";

export default function TutorCoursesPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { data: coursesData } = useQuery({ queryKey: ["tutor-courses"], queryFn: async () => (await api.get("/courses")).data });
  const { data: modulesData } = useQuery({
    queryKey: ["course-modules", selectedCourseId],
    queryFn: async () => (await api.get(`/courses/${selectedCourseId}/modules`)).data,
    enabled: !!selectedCourseId,
  });

  useEffect(() => {
    if (!selectedCourseId && coursesData?.items?.length) {
      setSelectedCourseId(coursesData.items[0].id);
    }
  }, [coursesData, selectedCourseId]);

  const courses = useMemo(() => coursesData?.items ?? [], [coursesData]);

  return (
    <div className="min-h-full bg-[#03091A] p-6 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Tutor Course Workspace</h1>
        <p className="mt-1 text-sm text-white/40">Review and organise modules and lessons for your courses.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Assigned courses</h2>
          </div>
          <div className="space-y-3">
            {courses.map((course: any) => (
              <button key={course.id} onClick={() => setSelectedCourseId(course.id)} className={`w-full rounded-2xl border p-3 text-left ${selectedCourseId === course.id ? "border-brand-500 bg-brand-500/10" : "border-white/10 bg-[#03091A]"}`}>
                <div className="font-semibold">{course.title}</div>
                <div className="mt-1 text-xs text-white/40">{course.category || "General"} • {course.mode}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#071428] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Layers size={18} className="text-brand-400" />
            <h2 className="text-lg font-semibold">Modules & lessons</h2>
          </div>
          {!selectedCourseId ? <p className="text-sm text-white/40">Select a course to view its content.</p> : (
            <div className="space-y-3">
              {(modulesData ?? []).map((module: any) => (
                <div key={module.id} className="rounded-2xl border border-white/10 bg-[#03091A] p-3">
                  <div className="font-semibold">{module.title}</div>
                  <div className="mt-2 space-y-2">
                    {(module.lessons ?? []).map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm text-white/70">
                        <PlayCircle size={14} className="text-brand-400" />
                        <span>{lesson.title}</span>
                      </div>
                    ))}
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
