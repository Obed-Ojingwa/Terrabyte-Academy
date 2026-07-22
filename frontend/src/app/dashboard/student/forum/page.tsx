"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { Users, MessageCircle, Plus, TrendingUp, ChevronDown, X, Check } from "lucide-react";

export default function StudentForumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // State for filters and form
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [questionFilter, setQuestionFilter] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);
  [searchParams.get("course") || null, setCourseFilter];
  const [isQuestion, setIsQuestion] = useState(false);

  // Fetch courses for filter dropdown
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get("/courses")).data
  });

  // Fetch threads with filtering
  const {
    data: threads = [],
    isLoading: threadsLoading,
    error: threadsError
  } = useQuery({
    queryKey: ["forum-threads", courseFilter, questionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (courseFilter) params.append("course_id", courseFilter);
      if (questionFilter !== null) params.append("is_question", String(questionFilter));
      return (await api.get(`/forum/threads?${params.toString()}`)).data;
    }
  });

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (payload: { title: string; body: string; course_id?: string; is_question?: boolean }) =>
      (await api.post("/forum/threads", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-threads", courseFilter, questionFilter] });
      setShowCreateModal(false);
      setFormTitle("");
      setFormBody("");
      setIsQuestion(false);
      toast.success("Thread created successfully!");
    },
    onError: () => toast.error("Failed to create thread. Please try again.")
  });

  // Handle filter changes
  const handleFilterChange = () => {
    router.push(
      `/dashboard/student/forum?${
        new URLSearchParams({
          course: courseFilter || "",
          is_question: questionFilter !== null ? String(questionFilter) : ""
        }).toString()
      }`,
      { scroll: true }
    );
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error("Please fill in both title and body");
      return;
    }

    const courseId = courseFilter || undefined; // Use current filter or none
    await createThreadMutation.mutateAsync({
      title: formTitle.trim(),
      body: formBody.trim(),
      course_id: courseId,
      is_question
    });
  };

  if (threadsError) {
    return (
      <div className="min-h-full page-light p-6">
        <div className="page-surface rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Failed to load discussions</h2>
          <p className="text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Apply filters to threads
  const filteredThreads = threads.filter((thread) => {
    const matchesCourse = !courseFilter || thread.course_id === courseFilter;
    const matchesQuestion = questionFilter === null || thread.is_question === questionFilter;
    return matchesCourse && matchesQuestion;
  });

  return (
    <div className="min-h-full page-light p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 flex items-center gap-3">
              <Users className="text-brand-500" />
              Discussion Forum
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Connect with peers and tutors to ask questions, discuss course materials, and share knowledge
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-transparent bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus-ring-brand-200 focus:ring-offset-2 transition-all duration-200"
            >
              <Plus className="mr-1 h-4 w-4" />
              Start Discussion
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl page-surface p-5 border border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter by:</span>
              <div className="flex items-center gap-2">
                <select
                  value={courseFilter || ""}
                  onChange={(e) => setCourseFilter(e.target.value || null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus-ring-brand-100"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    >
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={questionFilter === true}
                onChange={(e) => setQuestionFilter(e.target.checked ? true : null)}
                className="h-4 w-4 text-brand-500 focus:ring-brand-500"
              />
              Questions Only
            </label>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setCourseFilter(null);
                setQuestionFilter(null);
                router.push("/dashboard/student/forum", { scroll: true });
              }}
              className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-4">
            <div className="rounded-2xl page-surface p-7 shadow-xl border border-slate-100">
              <div className="flex justify-between items-start mb-5">
                <h2 className="text-xl font-bold text-slate-950 flex items-center gap-3">
                  <Plus className="text-brand-500" />
                  {isQuestion ? "Ask a Question" : "Start Discussion"}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} className="text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter a clear, descriptive title..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Content</label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    rows={4}
                    placeholder="Share your thoughts, ask your question, or start a discussion..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isQuestion}
                      onChange={(e) => setIsQuestion(e.target.checked)}
                      className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                    />
                    Mark as Question
                  </label>
                  <span className="ml-auto text-xs text-slate-500">
                    {isQuestion ? "Others can provide answers" : "Open for discussion"}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={createThreadMutation.isPending}
                    className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus-ring-brand-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {createThreadMutation.isPending ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9h.582M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Creating...
                      </>
                    ) : (
                      "Post Thread"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="space-y-6">
        {threadsLoading && !threads.length ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 border-2 border-brand-500/20 rounded-full border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">Loading discussions...</p>
          </div>
        ) : (
          filteredThreads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">
                {courseFilter || questionFilter !== null
                  ? "No discussions match your current filters."
                  : "No discussions yet. Be the first to start one!"}
              </p>
              {!courseFilter && !(
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 rounded-xl transition-all duration-200"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Start a Discussion
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreads.map((thread) => (
                <div key={thread.id} className="rounded-2xl page-surface p-6 border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        {!thread.course_id ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            General
                          </span>
                        ) : (
                          <>
                            {courseFilter && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                {course?.find(c => c.id === thread.course_id)?.title || "Course"}
                              </span>
                            )}
                            {!courseFilter && thread.course_id && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                                {course?.find(c => c.id === thread.course_id)?.title || "Course"}
                              </span>
                            )}
                          </>
                        )}
                        {thread.is_question && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800">
                            Question
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                        {thread.title}
                      </h3>

                      <p className="text-sm text-slate-600 line-clamp-3">
                        {thread.body}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span>
                            <Users className="mr-1 h-3 w-3" />
                            {thread.replies.length} reply{thread.replies.length !== 1 ? "s" : ""}
                          </span>
                          <span>
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(thread.created_at).toLocaleDateString()}
                          </span>
                          {thread.updated_at !== thread.created_at && (
                            <span className="ml-4">
                              <Clock className="mr-1 h-3 w-3" />
                              <span className="whitespace-nowrap">
                                {new Date(thread.updated_at).toLocaleString()}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-32 lg:flex-shrink-0">
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Replies</p>
                          <p className="text-2xl font-black">{thread.replies.length}</p>
                        </div>

                        {thread.replies.slice(0, 3).map((reply) => (
                          <div key={reply.id} className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                              {reply.body?.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="text-xs text-slate-600">{reply.body?.slice(0, 15)}...</div>
                          </div>
                        ))}

                        {thread.replies.length > 3 && (
                          <div className="text-center text-xs text-slate-400">
                            +{thread.replies.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}