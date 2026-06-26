"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function AdminContentPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"blog" | "events" | "payments">("blog");
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const { data: blogPosts = [] } = useQuery({ queryKey: ["admin-blog"], queryFn: async () => (await api.get("/blog")).data });
  const { data: events = [] } = useQuery({ queryKey: ["admin-events"], queryFn: async () => (await api.get("/events")).data });
  const { data: paymentsData } = useQuery({ queryKey: ["admin-payments"], queryFn: async () => (await api.get("/payments/history")).data });

  const createPost = useMutation({
    mutationFn: async () => api.post("/blog", { title: postTitle || "New post", slug: postSlug || `post-${Date.now()}`, excerpt: postExcerpt || "Draft", is_published: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-blog"] }); toast.success("Blog post published"); setPostTitle(""); setPostSlug(""); setPostExcerpt(""); },
    onError: () => toast.error("Unable to create blog draft")
  });

  const createEvent = useMutation({
    mutationFn: async () => api.post("/events", { title: eventTitle || "New event", description: eventDescription || "Upcoming event", start_date: eventDate || new Date().toISOString(), is_online: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success("Event created"); setEventTitle(""); setEventDescription(""); setEventDate(""); },
    onError: () => toast.error("Unable to create event")
  });

  const payments = useMemo(() => paymentsData?.items ?? [], [paymentsData]);

  return (
    <div className="p-6 space-y-6 bg-[#03091A] min-h-full text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Content & Payments</h1>
          <p className="text-white/40 text-sm mt-1">Manage blog posts, events, and payment records.</p>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl border border-white/10 p-1 w-fit bg-[#071428]">
        {(["blog", "events", "payments"] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm capitalize ${tab === item ? "bg-brand-500 text-white" : "text-white/50"}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === "blog" && (
        <div className="bg-[#071428] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Blog Posts</h2>
            <button onClick={() => createPost.mutate()} className="rounded-xl bg-brand-500 px-4 py-2 text-sm">Publish post</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#03091A] p-4">
              <input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Post title" className="w-full rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm" />
              <input value={postSlug} onChange={(e) => setPostSlug(e.target.value)} placeholder="Slug" className="w-full rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm" />
              <textarea value={postExcerpt} onChange={(e) => setPostExcerpt(e.target.value)} rows={4} placeholder="Excerpt" className="w-full rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm" />
            </div>
            <div className="space-y-3">
              {blogPosts.map((post: any) => (
                <div key={post.id} className="rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="text-sm text-white/40">{post.slug}</p>
                    </div>
                    <span className="text-xs text-white/40">{post.is_published ? "Published" : "Draft"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="bg-[#071428] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Events</h2>
            <button onClick={() => createEvent.mutate()} className="rounded-xl bg-brand-500 px-4 py-2 text-sm">Create event</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-[#03091A] p-4">
              <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event title" className="w-full rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm" />
              <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows={4} placeholder="Description" className="w-full rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm" />
              <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#071428] px-3 py-2 text-sm" />
            </div>
            <div className="space-y-3">
              {events.map((event: any) => (
                <div key={event.id} className="rounded-xl border border-white/10 p-4">
                  <p className="font-semibold">{event.title}</p>
                  <p className="text-sm text-white/40">{new Date(event.start_date).toLocaleString("en-NG")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="bg-[#071428] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="font-bold">Payment Records</h2>
          <div className="space-y-3">
            {payments.map((payment: any) => (
              <div key={payment.id} className="rounded-xl border border-white/10 p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{payment.gateway_ref}</p>
                  <p className="text-sm text-white/40">{payment.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₦{Number(payment.amount).toLocaleString()}</p>
                  <p className="text-sm text-white/40">{new Date(payment.created_at).toLocaleDateString("en-NG")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
