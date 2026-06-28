"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft, BookOpen, Clock3, Layers, MapPin, User } from "lucide-react";
import PublicHeader from "@/components/ui/PublicHeader";
import PaystackButton from "@/components/payments/PaystackButton";
import { useCourse } from "@/hooks/useCourses";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId || "";
  const { data: course, isLoading, isError } = useCourse(courseId);

  const enrollMutation = useMutation({
    mutationFn: async () => api.post("/enrollments", { course_id: courseId, mode: course?.mode || "online" }),
    onSuccess: () => {
      toast.success("You are now enrolled in this course.");
      router.push("/dashboard/student/courses");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Enrollment failed. Please try again.");
    },
  });

  const freeCourse = course?.price === 0;

  return (
    <div className="page-light min-h-screen pt-20 text-slate-950">
      <PublicHeader />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <button type="button" onClick={() => router.push("/public/courses")} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors">
              <ArrowLeft size={16} /> Back to courses
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Course details</h1>
              <p className="text-slate-600">Review the course and complete enrollment to unlock full access.</p>
            </div>
          </div>
          <Link href="/public/courses" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 transition-all">
            Browse all courses
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-100 p-8 animate-pulse h-96" />
            <div className="rounded-3xl border border-slate-200 bg-slate-100 p-8 animate-pulse h-96" />
          </div>
        ) : isError || !course ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
            <p className="text-xl font-semibold">Unable to load course details.</p>
            <p className="mt-2 text-sm">Please return to the course list or try again later.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{course.category || "General"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{course.level || "All levels"}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{course.mode}</span>
                </div>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">{course.title}</h2>
                <p className="mt-4 max-w-2xl text-slate-600 leading-7">{course.description || "No description available for this course."}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Price</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{freeCourse ? "Free" : formatCurrency(course.price)}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Duration</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{course.duration_weeks ? `${course.duration_weeks} weeks` : "Flexible"}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Published</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{formatDate(course.created_at)}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Mode</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{course.mode}</div>
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex items-center gap-3 text-slate-700">
                  <User size={18} className="text-brand-500" />
                  <div>
                    <p className="text-sm font-semibold">Instructor</p>
                    <p className="text-sm text-slate-500">{course.tutor ? `${course.tutor.first_name} ${course.tutor.last_name}` : "Terrabyte Academy"}</p>
                  </div>
                </div>
                {course.tutor?.avatar_url ? (
                  <img src={course.tutor.avatar_url} alt={`${course.tutor.first_name} ${course.tutor.last_name}`} className="h-16 w-16 rounded-3xl object-cover" />
                ) : null}
              </div>

              <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 text-lg font-semibold text-slate-950">What you'll learn</div>
                <div className="space-y-3 text-slate-600">
                  <p>Gain practical skills in {course.category || "this course"} with structured learning, real-world assignments, and mentorship support.</p>
                  <p>Designed for learners who want to move quickly from theory to hands-on application.</p>
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 text-lg font-semibold text-slate-950">Course outline</div>
                {!course.modules?.length ? (
                  <p className="text-sm text-slate-500">Lesson structure is being prepared. Check back later for a full syllabus.</p>
                ) : (
                  <div className="space-y-4">
                    {course.modules.map((module) => (
                      <div key={module.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-950">{module.title}</p>
                            <p className="text-sm text-slate-500">{module.lessons.length} lessons</p>
                          </div>
                          <div className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase text-brand-700">Module</div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                              <div className="font-medium">{lesson.title}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Clock3 size={14} />
                                <span>{lesson.duration_min ? `${lesson.duration_min} min` : "On demand"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.25em]">Ready to enroll?</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{freeCourse ? "Free course" : formatCurrency(course.price)}</p>
                  </div>
                  <div className="rounded-full bg-brand-500 px-3 py-2 text-sm font-semibold text-white">{course.mode}</div>
                </div>
                <div className="mt-6">
                  {freeCourse ? (
                    <button
                      type="button"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isLoading}
                      className="w-full rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 transition-all"
                    >
                      {enrollMutation.isLoading ? "Enrolling..." : "Enroll for free"}
                    </button>
                  ) : (
                    <PaystackButton courseId={course.id} amount={course.price} courseName={course.title} mode={course.mode} />
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex items-center gap-2 text-slate-900 font-semibold">
                  <Layers size={18} className="text-brand-500" />
                  Course details
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <p><strong className="text-slate-900">Category:</strong> {course.category || "None"}</p>
                  <p><strong className="text-slate-900">Level:</strong> {course.level || "Beginner"}</p>
                  <p><strong className="text-slate-900">Created on:</strong> {formatDate(course.created_at)}</p>
                  <p><strong className="text-slate-900">Course mode:</strong> {course.mode}</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
