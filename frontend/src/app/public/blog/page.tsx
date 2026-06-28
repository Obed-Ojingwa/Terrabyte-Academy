"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import PublicHeader from "@/components/ui/PublicHeader";

export default function PublicBlogPage() {
  const { data: posts = [] } = useQuery({ queryKey: ["public-blog"], queryFn: async () => (await api.get("/blog")).data });

  return (
    <div className="page-light min-h-screen pt-20 px-6 py-24 text-slate-950">
      <PublicHeader />
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Terrabyte Academy</p>
        <h1 className="mt-3 text-4xl font-black">Insights, updates, and learning stories</h1>
        <p className="mt-3 max-w-2xl text-white/45">Read the latest posts from our team and instructors.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {posts.map((post: any) => (
            <article key={post.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="text-sm text-brand-500">{post.category ?? "General"}</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{post.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{post.excerpt ?? "Read more about this update."}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
