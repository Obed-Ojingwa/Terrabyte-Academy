"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Phone, Calendar, TrendingUp, List, FileText, Award } from "lucide-react";

export default function StudentProfilePage() {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => (await api.get("/student/profile")).data
  });

  // Form state for editing basic profile info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setPhone(profile.phone || "");
    setAvatarUrl(profile.avatar_url || "");
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { first_name: string; last_name: string; phone?: string; avatar_url?: string }) =>
      (await api.patch("/users/me", payload)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(["student-profile"], data);
      updateUser({
        ...data,
        profile: {
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
        },
      });
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Unable to update profile"),
  });

  if (isError) {
    return (
      <div className="min-h-full page-light p-6 text-slate-950">
        <div className="page-surface rounded-3xl p-6 text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Failed to load profile</h2>
          <p className="text-slate-500">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-full page-light p-6">
        <div className="flex h-[80vh] items-center justify-center">
          <div className="rounded-xl border-2 border-brand-500/20 p-8 text-center">
            <div className="h-8 w-8 border-2 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
            <p className="mt-4 text-slate-500">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-full page-light p-6">
        <div className="flex h-[80vh] items-center justify-center">
          <div className="page-surface rounded-3xl p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No profile data</h2>
            <p className="text-slate-500">Unable to retrieve profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress stats for display
  const completionRate = profile.total_courses_enrolled > 0
    ? Math.round((profile.total_courses_completed / profile.total_courses_enrolled) * 100)
    : 0;

  const assignmentCompletionRate = profile.total_assignments_submitted > 0
    ? Math.round((profile.total_assignments_graded / profile.total_assignments_submitted) * 100)
    : 0;

  const examPassRate = profile.total_exams_taken > 0
    ? Math.round((profile.total_exams_passed / profile.total_exams_taken) * 100)
    : 0;

  const stats = useMemo(
    () => [
      {
        label: "Courses Completed",
        value: `${profile.total_courses_completed}/${profile.total_courses_enrolled}`,
        percentage: completionRate,
        icon: List,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-600"
      },
      {
        label: "Assignment Avg",
        value: profile.average_assignment_score !== null
          ? `${profile.average_assignment_score?.toFixed(1)}%`
          : "No submissions",
        percentage: assignmentCompletionRate,
        icon: FileText,
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-600"
      },
      {
        label: "Exam Pass Rate",
        value: `${profile.total_exams_passed}/${profile.total_exams_taken}`,
        percentage: examPassRate,
        icon: TrendingUp,
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-600"
      },
      {
        label: "Certificates Earned",
        value: String(profile.total_certificates_earned),
        percentage: profile.total_certificates_earned > 0 ? 100 : 0,
        icon: Award,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-600"
      }
    ],
    [profile]
  );

  const details = useMemo(
    () => [
      { label: "Email", value: profile.email ?? "Not set", icon: Mail },
      { label: "Phone", value: profile.phone || "Not set", icon: Phone },
      { label: "Joined", value: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown", icon: Calendar },
    ],
    [profile]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateMutation.mutateAsync({
      first_name: firstName,
      last_name: lastName,
      phone: phone || undefined,
      avatar_url: avatarUrl || undefined
    });
  };

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-8">
        <h1 className="text-2xl font-black flex items-center gap-3">
          Student Profile
          <span className="text-sm font-normal text-slate-500">Your academic journey</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">Manage your profile and track your learning progress</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl page-surface p-6 border ${stat.border} hover:shadow-md transition-shadow cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`${stat.bg} rounded-xl p-3`}>
                  <stat.icon size={20} className={`${stat.text}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-black">{stat.value}</p>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 animate-pulse"></div>
            </div>
            <div className="mt-2 h-1">
              <div
                className={`h-full w-full rounded bg-slate-200`}
                style={{ width: `${stat.percentage}%` }}
                className={`transition-all duration-500 ${stat.text}`}
              ></div>
            </div>
            <p className="mt-1 text-xs text-slate-500">{stat.percentage}%</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
        {/* Left Column - Personal Info & Enrollments */}
        <div className="space-y-8">
          {/* Personal Info Card */}
          <section className="page-surface rounded-2xl p-7 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xl font-black">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              <div>
                <p className="text-xl font-black">{profile.first_name} {profile.last_name}</p>
                <p className="mt-1 text-sm text-slate-500 capitalize">{profile.role?.name || "Student"}</p>
                {profile.is_verified && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {details.map((item, index) => (
                <div key={index} className="flex items-center gap-3 py-2 border-t border-slate-50 first:border-t-0">
                  <item.icon size={18} className="text-brand-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Edit Profile Form */}
          <section className="page-surface rounded-2xl p-7 shadow-sm border border-slate-100">
            <div className="mb-5 flex items-center gap-3">
              <User size={20} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-slate-950">Edit Profile Information</h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Phone number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Avatar URL (optional)</label>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus-ring-brand-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {updateMutation.isPending ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9h.582M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column - Academic Progress */}
        <div className="space-y-8">
          {/* Enrolled Courses */}
          <section className="page-surface rounded-2xl p-7 shadow-sm border border-slate-100">
            <div className="mb-5 flex items-center gap-3">
              <List size={20} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-slate-950">My Courses ({profile.total_courses_enrolled})</h2>
            </div>

            {profile.total_courses_enrolled > 0 ? (
              <div className="space-y-4">
                {profile.enrolled_courses.map((course) => (
                  <div key={course.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{course.course?.title || 'Unnamed Course'}</h3>
                        <p className="mt-1 text-xs text-slate-500">Progress: {course.progress || 0}%</p>
                      </div>
                      <div className="w-3 h-3 rounded-full {course.progress >= 100 ? 'bg-green-500' : course.progress >= 80 ? 'bg-yellow-400' : course.progress >= 50 ? 'bg-orange-400' : 'bg-red-400'}"></div>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded">
                      <div
                        className={`h-full w-[${course.progress || 0}%] rounded bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>You're not enrolled in any courses yet.</p>
                <a href="/dashboard/student/courses" className="mt-3 inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-500">
                  Browse Courses
                  <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </section>

          {/* Assignments */}
          <section className="page-surface rounded-2xl p-7 shadow-sm border border-slate-100">
            <div className="mb-5 flex items-center gap-3">
              <FileText size={20} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-slate-950">Assignments</h2>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-slate-600">
                <p className="mb-1">Submitted: {profile.total_assignments_submitted}</p>
                <p className="mb-1">Graded: {profile.total_assignments_graded}</p>
                <p>Average Score: {profile.average_assignment_score !== null ? `${profile.average_assignment_score?.toFixed(1)}%` : 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Exams */}
          <section className="page-surface rounded-2xl p-7 shadow-sm border border-slate-100">
            <div className="mb-5 flex items-center gap-3">
              <TrendingUp size={20} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-slate-950">Exams</h2>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-slate-600">
                <p className="mb-1">Taken: {profile.total_exams_taken}</p>
                <p className="mb-1">Passed: {profile.total_exams_passed}</p>
                <p>Pass Rate: {profile.total_exams_taken > 0 ? `${examPassRate}%` : 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Certificates */}
          <section className="page-surface rounded-2xl p-7 shadow-sm border border-slate-100">
            <div className="mb-5 flex items-center gap-3">
              <Award size={20} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-slate-950">Certifications</h2>
            </div>
            <div className="space-y-3">
              {profile.total_certificates_earned > 0 ? (
                <>
                  <p className="text-sm text-slate-600 mb-2">You have earned {profile.total_certificates_earned} certificate{profile.total_certificates_earned !== 1 ? 's' : ''}!</p>
                  <div className="space-y-2">
                    {profile.certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                        <Award size={18} className="text-amber-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{cert.course?.title || 'Unnamed Course'}</p>
                          <p className="text-xs text-slate-500">Issued: {new Date(cert.issued_at || 0).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No certificates earned yet. Complete courses to earn certifications!
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}