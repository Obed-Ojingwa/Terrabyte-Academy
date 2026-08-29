"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { Users, Plus, X, Calendar, Clock } from "lucide-react";

type Course = {
  id: string;
  title: string;
};

type ThreadReply = {
  id: string;
  body: string;
};

type Thread = {
  id: string;
  title: string;
  body: string;
  course_id?: string | null;
  is_question?: boolean;
  created_at: string;
  updated_at?: string;
  replies?: ThreadReply[];
};

export default function StudentForumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [questionFilter, setQuestionFilter] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [isQuestion, setIsQuestion] = useState(false);

  useEffect(() => {
    const initialCourse = searchParams.get("course") || null;
    const initialQuestion = searchParams.get("is_question");

    setCourseFilter(initialCourse);
    setQuestionFilter(
      initialQuestion === "true" ? true : initialQuestion === "false" ? false : null,
    );
  }, [searchParams]);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => (await api.get("/courses")).data,
  });

  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useQuery<Thread[]>({
    queryKey: ["forum-threads", courseFilter, questionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (courseFilter) params.append("course_id", courseFilter);
      if (questionFilter !== null) params.append("is_question", String(questionFilter));
      return (await api.get(`/forum/threads?${params.toString()}`)).data;
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      body: string;
      course_id?: string;
      is_question?: boolean;
    }) => (await api.post("/forum/threads", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-threads", courseFilter, questionFilter] });
      setShowCreateModal(false);
      setFormTitle("");
      setFormBody("");
      setIsQuestion(false);
      toast.success("Thread created successfully!");
    },
    onError: () => toast.error("Failed to create thread. Please try again."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formBody.trim()) {
      toast.error("Please fill in both title and body");
      return;
    }

    await createThreadMutation.mutateAsync({
      title: formTitle.trim(),
      body: formBody.trim(),
      course_id: courseFilter || undefined,
      is_question: isQuestion,
    });
  };

  const filteredThreads = (Array.isArray(threads) ? threads : []).filter((thread) => {
    const matchesCourse = !courseFilter || thread.course_id === courseFilter;
    const matchesQuestion = questionFilter === null || thread.is_question === questionFilter;
    return matchesCourse && matchesQuestion;
  });

  if (threadsError) {
    return (
      <div className="min-h-full page-light p-6">
        <div className="page-surface rounded-2xl p-8 text-center">
          <h2 className="mb-4 text-xl font-semibold">Failed to load discussions</h2>
          <p className="text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full page-light p-6">
      <div className="mb-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-950">
              <Users className="text-brand-500" />
              Discussion Forum
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Connect with peers and tutors to ask questions, discuss course materials, and share knowledge.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Start Discussion
          </button>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Filter by:</span>
              <select
                value={courseFilter || ""}
                onChange={(e) => setCourseFilter(e.target.value || null)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={questionFilter === true}
                onChange={(e) => setQuestionFilter(e.target.checked ? true : null)}
                className="h-4 w-4 text-brand-500 focus:ring-brand-500"
              />
              Questions Only
            </label>

            <button
              onClick={() => {
                setCourseFilter(null);
                setQuestionFilter(null);
                router.push("/dashboard/student/forum", { scroll: true });
              }}
              className="ml-auto text-sm text-slate-500 hover:text-slate-700 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-xl">
              <div className="mb-5 flex items-start justify-between">
                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-950">
                  <Plus className="text-brand-500" />
                  {isQuestion ? "Ask a Question" : "Start Discussion"}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full p-1.5 transition-colors hover:bg-slate-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Content</label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    rows={4}
                    placeholder="Share your thoughts, ask your question, or start a discussion..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
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

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="submit"
                    disabled={createThreadMutation.isPending}
                    className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createThreadMutation.isPending ? "Creating..." : "Post Thread"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {threadsLoading && threads.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-500/20 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading discussions...</p>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500">
              {courseFilter || questionFilter !== null
                ? "No discussions match your current filters."
                : "No discussions yet. Be the first to start one!"}
            </p>
            {!courseFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:from-brand-600 hover:to-brand-700"
              >
                <Plus className="mr-1 h-4 w-4" />
                Start a Discussion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredThreads.map((thread) => {
              const replies = thread.replies ?? [];
              return (
                <div
                  key={thread.id}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-start gap-3">
                        {!thread.course_id ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                            General
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {courses.find((course) => course.id === thread.course_id)?.title || "Course"}
                          </span>
                        )}

                        {thread.is_question && (
                          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Question
                          </span>
                        )}
                      </div>

                      <h3 className="mb-2 text-lg font-semibold text-slate-900">{thread.title}</h3>
                      <p className="text-sm text-slate-600">{thread.body}</p>

                      <div className="mt-4 border-t border-slate-50 pt-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {replies.length} reply{replies.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(thread.created_at).toLocaleDateString()}
                          </span>
                          {thread.updated_at && thread.updated_at !== thread.created_at && (
                            <span className="ml-4 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(thread.updated_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-32 lg:flex-shrink-0">
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-500">Replies</p>
                          <p className="text-2xl font-black text-slate-900">{replies.length}</p>
                        </div>

                        {replies.slice(0, 3).map((reply) => (
                          <div key={reply.id} className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                              {reply.body?.slice(0, 1).toUpperCase() || "A"}
                            </div>
                            <div className="text-xs text-slate-600">{reply.body?.slice(0, 15) || "New reply"}...</div>
                          </div>
                        ))}

                        {replies.length > 3 && (
                          <div className="text-center text-xs text-slate-400">+{replies.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
