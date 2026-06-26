import Link from "next/link";
import { Course } from "@/types/course";
import { formatCurrency } from "@/lib/utils";
import { Clock, Monitor, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

const modeIcons: Record<string, typeof Monitor> = { online: Monitor, physical: MapPin, private: User };
const levelColors: Record<string, string> = { beginner: "bg-green-500/10 text-green-400", intermediate: "bg-yellow-500/10 text-yellow-400", advanced: "bg-red-500/10 text-red-400" };

export default function CourseCard({ course }: { course: Course }) {
  const ModeIcon = modeIcons[course.mode] ?? Monitor;
  return (
    <Link href={`/public/courses/${course.id}`} className="group block">
      <div className="bg-[#071428] border border-white/[0.07] hover:border-brand-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/50">
        <div className="h-40 bg-gradient-to-br from-brand-900 to-[#020a16] flex items-center justify-center relative">
          <span className="text-5xl opacity-40">{course.category === "Geographic Information Systems" ? "🔐" : course.category === "Data Science" ? "📊" : course.category === "Surveying" ? "☁️" : course.category === "Autocad" ? "🎨" : "💻"}</span>
          <div className="absolute top-3 right-3"><span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", levelColors[course.level || ""] || "bg-white/10 text-white/50")}>{course.level || "All levels"}</span></div>
          {course.category && <div className="absolute bottom-3 left-3"><span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">{course.category}</span></div>}
        </div>
        <div className="p-5">
          <h3 className="font-bold text-white text-sm leading-snug mb-3 line-clamp-2 group-hover:text-brand-300 transition-colors">{course.title}</h3>
          <div className="flex items-center gap-3 text-[11px] text-white/35 mb-4">
            <span className="flex items-center gap-1"><ModeIcon size={11} /> {course.mode}</span>
            {course.duration_weeks && <span className="flex items-center gap-1"><Clock size={11} /> {course.duration_weeks}w</span>}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <span className="font-black text-white text-base">{course.price === 0 ? "Free" : formatCurrency(course.price)}</span>
            <span className="text-[11px] text-brand-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">Enroll →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
