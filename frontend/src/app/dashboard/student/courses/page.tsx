"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { BookOpen, Layers, PlayCircle, Clock3, Search, Sliders, TrendingUp } from "lucide-react";

export default function StudentCoursesPage() {
  const qc = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch filters (categories, levels, modes)
  const { data: filtersData, isLoading: filtersLoading } = useQuery({
    queryKey: ["course-filters"],
    queryFn: async () => (await api.get("/courses/filters")).data,
  });

  // Fetch popular/suggested courses
  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ["popular-courses"],
    queryFn: async () => (await api.get("/courses/suggestions")).data,
  });

  // Fetch courses with filters and search
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ["courses", searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      // Optionally add sort, page, page_size if needed
      params.append("page", "1");
      params.append("page_size", "100"); // fetch a reasonable number for client-side filtering/pagination
      return (await api.get(`/courses?${params.toString()}`)).data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) =>
      api.post("/enrollments", { course_id: courseId, mode: "online" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      toast.success("Enrollment request received");
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.detail || "Unable to enroll right now"),
  });

  // Fetch my enrollments
  const { data: enrollmentsData } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: async () => (await api.get("/enrollments")).data,
  });

  const courses = useMemo(() => coursesData?.items ?? [], [coursesData]);
  const enrollments = useMemo(() => enrollmentsData ?? [], [enrollmentsData]);
  const popularCourses = useMemo(() => popularData ?? [], [popularData]);
  const categories = useMemo(
    () => (filtersData?.categories ?? []).filter(Boolean),
    [filtersData]
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e: any) => e.course_id || e.course?.id)),
    [enrollments]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course: any) => {
      const matchesSearch =
        !searchTerm ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategory]);

  const selectedCourse =
    courses.find((c: any) => c.id === selectedCourseId) ??
    filteredCourses[0] ??
    null;

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6">
        <h1 className="text-2xl font-flex items-center gap-3">
          <BookOpen className="text-brand-500 mr-2" />
          Course Discovery
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Find and enroll in courses that match your interests and goals
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 page-surface rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="mb-4 flex items-center gap-2 text-slate-950">
          <Search size={18} className="text-brand-500" />
          <h2 className="text-lg font-semibold">Find Courses</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr_200px]">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Search courses</label>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter course title or keywords"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All Categories</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3 flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory(null);
              }}
              className="w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Popular/Suggested Courses */}
      {!popularLoading && (
        <div className="mb-6 page-surface rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <TrendingUp size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Popular Courses</h2>
          </div>
          <div className="space-y-4">
            {popularCourses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {popularCourses.map((course: any) => (
                  <div
                    key={course.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-950">{course.title}</h3>
                        <div className="mt-1 text-xs text-slate-500">
                          {course.category || "General"} • {course.mode}
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        enrolledCourseIds.has(course.id)
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-brand-50 text-brand-700"
                      }`}>
                        {enrolledCourseIds.has(course.id) ? "Enrolled" : "Open"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {course.description || "No description available."}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{course.modules?.length ?? 0} modules</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          enrollMutation.mutate(course.id);
                        }}
                        disabled={
                          enrolledCourseIds.has(course.id) ||
                          enrollMutation.isPending
                        }
                        className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {enrolledCourseIds.has(course.id)
                          ? "Enrolled"
                          : "Enroll"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                No popular courses available at the moment.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Course Listings */}
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="page-surface rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <BookOpen size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Available Courses</h2>
          </div>
          <div className="space-y-3">
            {filteredCourses.length > 0 ? (
              <div className="space-y-3">
                {filteredCourses.map((course: any) => {
                  const isEnrolled = enrolledCourseIds.has(course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left ${
                        selectedCourseId === course.id
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-950">{course.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {course.category || "General"} • {course.mode}
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isEnrolled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-brand-50 text-brand-700"
                        }`}>
                          {isEnrolled ? "Enrolled" : "Open"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>{course.modules?.length ?? 0} modules</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            enrollMutation.mutate(course.id);
                          }}
                          disabled={isEnrolled || enrollMutation.isPending}
                          className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {isEnrolled
                            ? "Already enrolled"
                            : "Enroll"}
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
                {searchTerm || selectedCategory ? (
                  <>
                    <p>No courses match your current filters.</p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory(null);
                      }}
                      className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 rounded-xl transition-all duration-200"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Show all courses
                    </button>
                  </>
                ) : (
                  <p>No courses found yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="page-surface rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="mb-4 flex items-center gap-2 text-slate-950">
            <Layers size={18} className="text-brand-500" />
            <h2 className="text-lg font-semibold">Course details</h2>
          </div>
          {!selectedCourse ? (
            <p className="text-slate-500">Select a course to view its lessons and progress.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-950">{selectedCourse.title}</div>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedCourse.description || "No course description available."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">
                    {selectedCourse.duration_weeks
                      ? `${selectedCourse.duration_weeks} weeks`
                      : "Flexible"}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-semibold text-slate-950">Lessons</div>
                <div className="space-y-2">
                  {(selectedCourse.modules ?? []).map((module: any) => (
                    <div key={module.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="font-semibold text-slate-950">{module.title}</div>
                      <div className="mt-2 space-y-2">
                        {(module.lessons ?? []).map((lesson: any) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            <div className="flex items-center gap-2">
                              <PlayCircle size={14} className="text-brand-500" />
                              <span>{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock3 size={12} />
                              <span>
                                {lesson.duration_min
                                  ? `${lesson.duration_min} min`
                                  : "On demand"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!selectedCourse.modules?.length && (
                    <p className="text-sm text-slate-500">
                      No lessons are available for this course.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}