"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Thread { id: string; title: string; body: string; created_at: string; replies: Array<{ id: string; body: string; created_at: string }> }

export default function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const loadThreads = async () => {
    const { data } = await api.get("/forum/threads");
    setThreads(data);
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const createThread = async () => {
    if (!title || !body) return;
    await api.post("/forum/threads", { title, body });
    setTitle("");
    setBody("");
    await loadThreads();
  };

  return (
    <div className="page-light min-h-full p-6 text-slate-950">
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Discussion forum</h1>
        <p className="mt-2 text-sm text-slate-500">Ask questions, share insights, and follow course conversations.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          {threads.map((thread) => (
            <div key={thread.id} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">{thread.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{thread.body}</p>
              <div className="mt-4 space-y-2">
                {thread.replies.map((reply) => (
                  <div key={reply.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{reply.body}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Start a discussion</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Thread title" className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your question or insight" className="mt-3 min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950" />
          <button onClick={createThread} className="mt-4 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Post thread</button>
        </div>
      </div>
    </div>
  );
}
