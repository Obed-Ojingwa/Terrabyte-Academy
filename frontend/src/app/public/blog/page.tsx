"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function PublicBlogPage() {
  const { data: posts = [] } = useQuery({ queryKey: ["public-blog"], queryFn: async () => (await api.get("/blog")).data });

  return (
    <div className="min-h-screen bg-[#03091A] px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Terrabyte Academy</p>
        <h1 className="mt-3 text-4xl font-black">Insights, updates, and learning stories</h1>
        <p className="mt-3 max-w-2xl text-white/45">Read the latest posts from our team and instructors.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {posts.map((post: any) => (
            <article key={post.id} className="rounded-3xl border border-white/10 bg-[#071428] p-6">
              <div className="text-sm text-brand-300">{post.category ?? "General"}</div>
              <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
              <p className="mt-3 text-sm text-white/45">{post.excerpt ?? "Read more about this update."}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
