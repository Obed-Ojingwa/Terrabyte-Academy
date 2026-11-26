"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  Clock3,
  Compass,
  GraduationCap,
  MapPin,
  MonitorPlay,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import PublicHeader from "@/components/ui/PublicHeader";
import { useCourses, usePopularCourses } from "@/hooks/useCourses";
import { formatCurrency } from "@/lib/utils";
import type { Course } from "@/types/course";
import academyLogo from "./public/terrabyte_academy_logo.png";

const heroImage =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1800&q=85&auto=format&fit=crop";

const imageCollage = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&q=85&auto=format&fit=crop",
];

const stats = [
  { value: "2,400+", label: "Students trained", icon: UsersRound },
  { value: "48", label: "Courses offered", icon: BookOpen },
  { value: "95%", label: "Completion rate", icon: BadgeCheck },
  { value: "100%", label: "Career focused", icon: GraduationCap },
];

const features = [
  {
    title: "Practical learning",
    description: "Build useful skills through hands-on projects and real-world exercises.",
    icon: Compass,
  },
  {
    title: "Flexible learning",
    description: "Choose an online, in-person, or hybrid learning experience.",
    icon: Clock3,
  },
  {
    title: "Expert guidance",
    description: "Learn with support from experienced instructors and mentors.",
    icon: GraduationCap,
  },
  {
    title: "Career focused",
    description: "Develop practical skills aligned with changing industry needs.",
    icon: ArrowUpRight,
  },
];

const steps = [
  { number: "01", title: "Choose a course", description: "Explore programmes and find a course that fits your goals." },
  { number: "02", title: "Apply to learn", description: "Send your application and hear from our academy team." },
  { number: "03", title: "Start learning", description: "Get access to guided lessons, materials, and support." },
];

const testimonials = [
  {
    name: "Adaeze Okonkwo",
    role: "Cybersecurity Analyst",
    quote:
      "Terrabyte Academy completely changed my career. The instructors bring real industry experience, and the hands-on projects prepared me from day one.",
    initials: "AO",
  },
  {
    name: "Emeka Nwosu",
    role: "Data Engineer",
    quote:
      "Every module was immediately applicable at work. No fluff, just practical skills. The support from tutors and classmates made a real difference.",
    initials: "EN",
  },
  {
    name: "Fatima Bello",
    role: "Cloud Architect",
    quote:
      "The course was thorough, practical, and well supported. I felt confident applying my new skills in real projects.",
    initials: "FB",
  },
  {
    name: "Chukwudi Eze",
    role: "Frontend Developer",
    quote:
      "The instructors respond quickly, the student community is genuinely helpful, and the projects are the right kind of challenging.",
    initials: "CE",
  },
];

const faqs = [
  {
    question: "Who can enrol at Terrabyte Academy?",
    answer:
      "Our courses welcome beginners and working professionals. Each course page outlines its level and any requirements before you apply.",
  },
  {
    question: "Will I receive a certificate after completing my course?",
    answer:
      "Students can request a certificate after enrolling. Certificates are reviewed by the academy and issued when approved.",
  },
  {
    question: "How do I pay for a course?",
    answer:
      "After your course application is approved, payment options are available on your student dashboard. Course materials unlock when payment is confirmed.",
  },
  {
    question: "What learning options are available?",
    answer:
      "Course delivery can be online, in person, or hybrid. Check the course details for the available learning mode.",
  },
  {
    question: "How long does a course take?",
    answer:
      "Course duration varies. If a duration or start date has not been set, the course page will say so.",
  },
  {
    question: "Can I apply for more than one course?",
    answer:
      "Yes. You can apply for multiple courses. Each application and its review status is shown on your dashboard.",
  },
  {
    question: "Do I need previous experience to take a course?",
    answer:
      "It depends on the course. Review its level and requirements on the course page before applying.",
  },
  {
    question: "Can I speak with someone before enrolling?",
    answer:
      "Yes. Use the Contact Us page and our team can help you choose the right programme.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-9 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-blue-300" : "text-blue-700"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`text-3xl font-black tracking-tight sm:text-4xl ${light ? "text-white" : "text-[#102044]"}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-3 max-w-xl text-sm leading-6 sm:text-base ${light ? "text-blue-100/70" : "text-slate-500"}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function CourseArtwork({ course }: { course: Course }) {
  const image = course.thumbnail_url;
  const category = course.category?.toLowerCase() ?? "";
  const icon = category.includes("gis") || category.includes("survey")
    ? "🌍"
    : category.includes("data")
      ? "📊"
      : category.includes("design")
        ? "✦"
        : category.includes("cloud")
          ? "☁️"
          : "⌘";

  return (
    <div
      className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-700 via-[#244a9d] to-[#0c1a39]"
      style={image ? { backgroundImage: `linear-gradient(135deg, rgba(7,20,47,.18), rgba(7,20,47,.4)), url("${image}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
    >
      {!image && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full border border-white/10" />
          <div className="absolute h-24 w-24 rounded-full border border-white/10" />
          <span className="relative text-5xl drop-shadow">{icon}</span>
        </div>
      )}
      <span className="absolute left-4 top-4 max-w-[75%] truncate rounded-full border border-white/20 bg-[#07162d]/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
        {course.category || "Professional course"}
      </span>
      <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
        <Sparkles size={12} /> {course.level || "All levels"}
      </span>
    </div>
  );
}

function FeaturedCourseCard({ course }: { course: Course }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(16,32,68,.06)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_42px_rgba(16,32,68,.12)]">
      <Link href={`/public/courses/${course.id}`} aria-label={`View ${course.title}`} className="block">
        <CourseArtwork course={course} />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1"><MonitorPlay size={14} /> {course.mode}</span>
          {course.duration_weeks ? (
            <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {course.duration_weeks} weeks</span>
          ) : null}
        </div>
        <Link href={`/public/courses/${course.id}`} className="text-base font-bold leading-snug text-[#102044] transition group-hover:text-blue-700">
          {course.title}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
          {course.description || "Explore the course details and discover practical skills you can build with Terrabyte Academy."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-5">
          <span className="font-extrabold text-[#102044]">
            {Number(course.price) === 0 ? "Free" : formatCurrency(course.price)}
          </span>
          <Link
            href={`/public/courses/${course.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-700 hover:text-white"
          >
            View course <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const {
    data: courseData,
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useCourses({ page_size: "6" });
  const {
    data: popularData,
    isError: popularError,
    refetch: refetchPopular,
  } = usePopularCourses(6);
  const courses: Course[] = courseData?.items ?? [];
  const trendingCourses: Course[] = popularData ?? [];
  const visibleTestimonials = testimonials.slice(testimonialPage * 2, testimonialPage * 2 + 2);
  const testimonialPages = Math.ceil(testimonials.length / 2);

  return (
    <main className="min-h-screen overflow-hidden bg-white font-sans text-slate-900">
      <PublicHeader />

      <section className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-[#071733] pt-16 sm:min-h-[720px]">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url("${heroImage}")` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071733]/95 via-[#071733]/75 to-[#071733]/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071733]/85 via-transparent to-[#071733]/10" />
        <div className="absolute -left-36 top-24 -z-10 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="mx-auto w-full max-w-7xl px-5 pb-48 pt-16 sm:px-8 md:pb-52 lg:px-12">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-100 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,.9)]" />
              Nigeria&apos;s technology and geospatial academy
            </div>
            <h1 className="max-w-[740px] text-5xl font-black leading-[1.03] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl">
              Learn skills that{" "}
              <span className="text-blue-300">actually matter.</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-blue-50/80 sm:text-base sm:leading-8">
              Practical, industry-focused training for people ready to build new skills and take the next step in their careers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/public/courses"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,.35)] transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Explore courses <ArrowRight size={17} />
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/10"
              >
                Discover our academy <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#071733]/35 backdrop-blur-md">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-5 py-5 sm:px-8 md:grid-cols-4 md:px-12 md:py-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 px-3 py-2 first:pl-0 md:justify-center md:px-5">
                <Icon size={20} className="shrink-0 text-blue-300" />
                <div>
                  <p className="text-xl font-black leading-none text-white sm:text-2xl">{value}</p>
                  <p className="mt-1.5 text-[10px] font-medium text-blue-100/70 sm:text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <a href="#why-us" aria-label="Scroll to why choose us" className="absolute bottom-[118px] right-7 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:bg-white/10 md:flex">
          <ArrowDown size={17} />
        </a>
      </section>

      <section id="why-us" className="relative overflow-hidden px-5 py-20 sm:px-8 md:py-24 lg:px-12">
        <div className="pointer-events-none absolute -right-36 -top-32 h-96 w-96 rounded-full bg-blue-50 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Why Terrabyte Academy"
              title="Learn with purpose. Grow with confidence."
              description="Build practical, career-ready skills with flexible courses, experienced instructors, and a community that helps you move forward."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map(({ title, description, icon: Icon }, index) => (
                <div
                  key={title}
                  className={`group rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 ${
                    index === 1
                      ? "border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-900/15"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                  }`}
                >
                  <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${index === 1 ? "bg-white/15 text-white" : "bg-blue-50 text-blue-700"}`}>
                    <Icon size={19} />
                  </span>
                  <h3 className={`font-bold ${index === 1 ? "text-white" : "text-[#102044]"}`}>{title}</h3>
                  <p className={`mt-2 text-sm leading-6 ${index === 1 ? "text-blue-100" : "text-slate-500"}`}>{description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl lg:pt-5">
            <div className="h-64 overflow-hidden rounded-[1.8rem] shadow-[0_25px_70px_rgba(16,32,68,.2)] sm:h-80">
              <div className="h-full w-full bg-cover bg-center transition duration-700 hover:scale-105" style={{ backgroundImage: `url("${imageCollage[0]}")` }} />
            </div>
            <div className="absolute -bottom-9 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white shadow-xl sm:h-20 sm:w-20">
              <Image src={academyLogo} alt="Terrabyte Academy" className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {imageCollage.slice(1).map((image) => (
                <div key={image} className="h-32 overflow-hidden rounded-2xl shadow-md sm:h-40">
                  <div className="h-full w-full bg-cover bg-center transition duration-700 hover:scale-105" style={{ backgroundImage: `url("${image}")` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fd] px-5 py-16 sm:px-8 md:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="A clear path forward"
            title="Your learning journey"
            description="A supportive experience from your first course search to your next achievement."
          />
          <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex min-h-32 items-center gap-5 rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_6px_20px_rgba(16,32,68,.04)] sm:px-7">
                <span className="text-3xl font-black tracking-tight text-blue-700">{step.number}</span>
                <div>
                  <h3 className="font-bold text-[#102044]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-5 text-slate-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && <ArrowRight size={17} className="absolute -right-2.5 z-10 hidden text-blue-500 md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Learn something new"
            title="Featured courses"
            description="Explore practical programmes designed to help you build knowledge and put it to work."
          />
          {coursesLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[390px] animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : coursesError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
              <p className="font-semibold text-[#102044]">Courses couldn&apos;t load just now</p>
              <p className="mt-1 text-sm text-slate-600">Please try again, or browse the catalogue directly.</p>
              <button type="button" onClick={() => refetchCourses()} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-600">
                Try again
              </button>
            </div>
          ) : courses.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 6).map((course) => <FeaturedCourseCard key={course.id} course={course} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <BookOpen className="mx-auto text-blue-600" size={28} />
              <p className="mt-3 font-semibold text-[#102044]">New courses are on the way</p>
              <p className="mt-1 text-sm text-slate-500">Visit the course catalogue to see what is currently available.</p>
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <Link href="/public/courses" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-[#102044] transition hover:border-blue-300 hover:text-blue-700">
              Browse all courses <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {(!!trendingCourses.length || popularError) && (
        <section className="relative overflow-hidden bg-[#091a3a] px-5 py-20 text-white sm:px-8 md:py-24 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.13]" style={{ backgroundImage: "linear-gradient(rgba(147,197,253,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,.35) 1px, transparent 1px)", backgroundSize: "42px 42px", maskImage: "linear-gradient(to bottom right, black, transparent 75%)" }} />
          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                eyebrow="Popular with learners"
                title="Trending courses"
                description="Courses learners are exploring right now."
                light
              />
              <Link href="/public/courses" className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white md:mb-12">
                See all courses <ArrowRight size={16} />
              </Link>
            </div>
            {popularError ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 text-sm text-blue-100/80">
                Trending courses are temporarily unavailable.{" "}
                <button type="button" onClick={() => refetchPopular()} className="font-bold text-white underline underline-offset-4">
                  Try again
                </button>
              </div>
            ) : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {trendingCourses.slice(0, 6).map((course) => (
                <Link
                  key={course.id}
                  href={`/public/courses/${course.id}`}
                  className="group flex min-h-[108px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur-sm transition hover:border-blue-300/40 hover:bg-white/[0.12]"
                >
                  <div className="h-[76px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-[#12254c]">
                    {course.thumbnail_url ? (
                      <div className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${course.thumbnail_url}")` }} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl"><BookOpen size={25} className="text-blue-100" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-white">{course.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-blue-100/60">{course.category || course.level || "Explore the course"}</p>
                    <p className="mt-2 text-xs font-bold text-blue-300">{Number(course.price) === 0 ? "Free" : formatCurrency(course.price)}</p>
                  </div>
                  <ArrowUpRight size={17} className="mr-1 shrink-0 text-blue-200/60 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              ))}
            </div>}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-[#111a35] px-5 py-20 sm:px-8 md:py-24 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(49,91,178,.32),transparent_55%),linear-gradient(120deg,rgba(9,18,42,.96),rgba(17,26,53,.86))]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-9 flex items-end justify-between gap-5">
            <SectionHeading
              eyebrow="Student stories"
              title="Hear it from our learners"
              description="Real experiences from people growing their skills with Terrabyte."
              light
            />
            <div className="mb-12 hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setTestimonialPage((page) => (page - 1 + testimonialPages) % testimonialPages)}
                aria-label="Previous testimonials"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
              >
                <ArrowLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => setTestimonialPage((page) => (page + 1) % testimonialPages)}
                aria-label="Next testimonials"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleTestimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-xl backdrop-blur-md sm:p-8">
                <div className="mb-5 flex items-center gap-1 text-amber-300" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}
                </div>
                <p className="min-h-[88px] text-sm leading-7 text-white/80">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-sm font-black text-white">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{testimonial.name}</p>
                    <p className="mt-0.5 text-xs text-blue-100/60">{testimonial.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-2 sm:hidden">
            {Array.from({ length: testimonialPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setTestimonialPage(index)}
                aria-label={`Show testimonial page ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${testimonialPage === index ? "w-8 bg-blue-400" : "w-2 bg-white/30"}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:py-24 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-9 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">A few helpful answers</p>
            <h2 className="text-3xl font-black tracking-tight text-[#102044] sm:text-4xl">Frequently asked questions</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Everything you need to know to take your next step with us.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={faq.question} className={`overflow-hidden rounded-xl border transition ${isOpen ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-[#f7f8fa] hover:border-slate-300"}`}>
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-[#172744]"
                  >
                    {faq.question}
                    <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-blue-700" : ""}`} />
                  </button>
                  {isOpen && <p className="px-4 pb-4 text-sm leading-6 text-slate-600">{faq.answer}</p>}
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">Still have questions?</p>
            <Link href="/contact" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600">
              Contact our team <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 md:pb-20 lg:px-12">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#0b1c3e] px-6 py-12 text-center shadow-[0_24px_70px_rgba(8,28,66,.2)] sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,.28),transparent_55%),linear-gradient(125deg,rgba(7,20,47,.1),rgba(24,56,112,.35))]" />
          <div className="relative">
            <span className="inline-flex rounded-full border border-blue-300/25 bg-blue-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Your next chapter starts here</span>
            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">Ready to transform your career?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-blue-100/75 sm:text-base">
              Join a community of learners building practical skills for a changing world.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/public/courses" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-400">
                Find your course <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Talk to our team <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#07152f] px-5 pb-6 pt-14 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_.8fr_1fr]">
            <div>
              <Link href="/" className="inline-flex rounded-md bg-white p-2">
                <Image src={academyLogo} alt="Terrabyte Academy" className="h-12 w-auto object-contain" />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-blue-100/60">
                Practical, career-focused learning for people ready to build what comes next.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["LinkedIn", "Instagram", "Facebook"].map((social) => (
                  <span key={social} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-blue-100/65">{social}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Explore</h3>
              <div className="flex flex-col gap-3 text-sm text-blue-100/65">
                <Link href="/public/courses" className="transition hover:text-white">All courses</Link>
                <Link href="/about" className="transition hover:text-white">About us</Link>
                <Link href="/public/blog" className="transition hover:text-white">Blog & news</Link>
                <Link href="/public/events" className="transition hover:text-white">Events</Link>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Learning</h3>
              <div className="flex flex-col gap-3 text-sm text-blue-100/65">
                <Link href="/public/courses" className="transition hover:text-white">Browse courses</Link>
                <Link href="/auth/register" className="transition hover:text-white">Create an account</Link>
                <Link href="/auth/login" className="transition hover:text-white">Student login</Link>
                <Link href="/public/verify-certificate" className="transition hover:text-white">Verify certificate</Link>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">Get in touch</h3>
              <div className="flex flex-col gap-3 text-sm text-blue-100/65">
                <a href="mailto:hello@terrabyteacademy.com" className="transition hover:text-white">hello@terrabyteacademy.com</a>
                <Link href="/contact" className="transition hover:text-white">Contact our team</Link>
                <span className="inline-flex items-center gap-2"><MapPin size={14} className="text-blue-300" /> Lagos, Nigeria</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 pt-5 text-xs text-blue-100/40 sm:flex-row">
            <p>© {new Date().getFullYear()} Terrabyte Academy. All rights reserved.</p>
            <div className="flex gap-5">
              <Link href="/contact" className="transition hover:text-white">Privacy</Link>
              <Link href="/contact" className="transition hover:text-white">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
