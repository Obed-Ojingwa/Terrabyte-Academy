"use client";
import { useState } from "react";
import { useCourses, usePopularCourses } from "@/hooks/useCourses";
import CourseCard from "@/components/courses/CourseCard";
import CourseFilter from "@/components/courses/CourseFilter";
import PublicHeader from "@/components/ui/PublicHeader";

export default function CoursesPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const { data, isLoading } = useCourses({ ...filters, ...(search ? { search } : {}) });
  const { data: suggestions } = usePopularCourses(6);
  return (
    <div className="page-light min-h-screen pt-20 text-slate-950">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-2 tracking-tight">Explore Courses</h1>
        <p className="text-slate-600 mb-8">Find the perfect course to advance your career</p>
        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
          <input type="text" placeholder="Search courses..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-white border border-slate-200 focus:border-brand-500 text-slate-950 placeholder:text-slate-400 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all shadow-sm"/>
        </div>
        {suggestions?.length ? (
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Popular suggestions</h2>
              <span className="text-sm text-white/35">Based on enrollments</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((course: any) => <CourseCard key={course.id} course={course} />)}
            </div>
          </div>
        ) : null}
        <div className="flex gap-10">
          <div className="w-52 shrink-0"><CourseFilter filters={filters} onChange={setFilters}/></div>
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_,i)=><div key={i} className="bg-[#071428] rounded-2xl h-64 animate-pulse"/>)}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items?.map((c:any)=><CourseCard key={c.id} course={c}/>)}
                {!data?.items?.length && <p className="text-white/30 col-span-3 text-center py-20">No courses found matching your filters.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
