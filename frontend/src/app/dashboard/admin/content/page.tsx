"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  is_published: boolean;
};

type EventFormState = {
  title: string;
  description: string;
  start_date: string;
  is_online: boolean;
};

export default function AdminContentPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"blog" | "events" | "payments" | "certificates">("blog");
  const [postForm, setPostForm] = useState<BlogFormState>({ title: "", slug: "", excerpt: "", is_published: true });
  const [editingPostSlug, setEditingPostSlug] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>({ title: "", description: "", start_date: "", is_online: true });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { data: blogPosts = [] } = useQuery({ queryKey: ["admin-blog"], queryFn: async () => (await api.get("/blog")).data });
  const { data: events = [] } = useQuery({ queryKey: ["admin-events"], queryFn: async () => (await api.get("/events")).data });
  const { data: paymentsData } = useQuery({ queryKey: ["admin-payments"], queryFn: async () => (await api.get("/payments/history")).data });
  const { data: certificates = [] } = useQuery({ queryKey: ["admin-certificates"], queryFn: async () => (await api.get("/certificates/")).data });

  const savePost = useMutation({
    mutationFn: async () => {
      const payload = {
        title: postForm.title || "New post",
        slug: postForm.slug || `post-${Date.now()}`,
        excerpt: postForm.excerpt || "Draft",
        is_published: postForm.is_published,
      };
      return editingPostSlug ? api.put(`/blog/${editingPostSlug}`, payload) : api.post("/blog", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success(editingPostSlug ? "Blog post updated" : "Blog post published");
      setPostForm({ title: "", slug: "", excerpt: "", is_published: true });
      setEditingPostSlug(null);
    },
    onError: () => toast.error("Unable to save blog post"),
  });

  const deletePost = useMutation({
    mutationFn: async (slug: string) => api.delete(`/blog/${slug}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Blog post removed");
    },
    onError: () => toast.error("Unable to remove blog post"),
  });

  const saveEvent = useMutation({
    mutationFn: async () => {
      const payload = {
        title: eventForm.title || "New event",
        description: eventForm.description || "Upcoming event",
        start_date: eventForm.start_date || new Date().toISOString(),
        is_online: eventForm.is_online,
      };
      return editingEventId ? api.put(`/events/${editingEventId}`, payload) : api.post("/events", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success(editingEventId ? "Event updated" : "Event created");
      setEventForm({ title: "", description: "", start_date: "", is_online: true });
      setEditingEventId(null);
    },
    onError: () => toast.error("Unable to save event"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => api.delete(`/events/${eventId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event removed");
    },
    onError: () => toast.error("Unable to remove event"),
  });

  const approveCertificate = useMutation({
    mutationFn: async (certificateId: string) => api.put(`/certificates/${certificateId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-certificates"] });
      toast.success("Certificate approved");
    },
    onError: () => toast.error("Unable to approve certificate"),
  });

  const payments = useMemo(() => paymentsData?.items ?? [], [paymentsData]);

  return (
    <div className="min-h-full page-light p-6 text-slate-950">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Content & Payments</h1>
          <p className="mt-1 text-sm text-slate-500">Manage blog posts, events, certificates, and payment records.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200/70 bg-slate-50 p-1">
        {(["blog", "events", "payments", "certificates"] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm capitalize ${tab === item ? "bg-brand-500 text-white" : "text-slate-500 hover:text-slate-900"}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === "blog" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Blog Posts</h2>
            <button onClick={() => savePost.mutate()} className="rounded-xl bg-brand-500 px-4 py-2 text-sm text-white">
              {editingPostSlug ? "Update post" : "Publish post"}
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <input value={postForm.title} onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Post title" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
              <input value={postForm.slug} onChange={(e) => setPostForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="Slug" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
              <textarea value={postForm.excerpt} onChange={(e) => setPostForm((prev) => ({ ...prev, excerpt: e.target.value }))} rows={4} placeholder="Excerpt" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
              {editingPostSlug && <button onClick={() => { setEditingPostSlug(null); setPostForm({ title: "", slug: "", excerpt: "", is_published: true }); }} className="text-sm text-slate-500">Cancel editing</button>}
            </div>
            <div className="space-y-3">
              {blogPosts.map((post: any) => (
                <div key={post.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{post.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingPostSlug(post.slug); setPostForm({ title: post.title, slug: post.slug, excerpt: post.excerpt ?? "", is_published: post.is_published }); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-brand-600 hover:bg-slate-50">Edit</button>
                      <button onClick={() => deletePost.mutate(post.slug)} className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Events</h2>
            <button onClick={() => saveEvent.mutate()} className="rounded-xl bg-brand-500 px-4 py-2 text-sm text-white">{editingEventId ? "Update event" : "Create event"}</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <input value={eventForm.title} onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Event title" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
              <textarea value={eventForm.description} onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} placeholder="Description" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
              <input type="datetime-local" value={eventForm.start_date} onChange={(e) => setEventForm((prev) => ({ ...prev, start_date: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950" />
              {editingEventId && <button onClick={() => { setEditingEventId(null); setEventForm({ title: "", description: "", start_date: "", is_online: true }); }} className="text-sm text-slate-500">Cancel editing</button>}
            </div>
            <div className="space-y-3">
              {events.map((event: any) => (
                <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{new Date(event.start_date).toLocaleString("en-NG")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingEventId(event.id); setEventForm({ title: event.title, description: event.description ?? "", start_date: event.start_date?.slice(0, 16) ?? "", is_online: event.is_online }); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-brand-600 hover:bg-slate-50">Edit</button>
                      <button onClick={() => deleteEvent.mutate(event.id)} className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Payment Records</h2>
          <div className="space-y-3">
            {payments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold">{payment.gateway_ref}</p>
                  <p className="text-sm text-slate-500">{payment.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₦{Number(payment.amount).toLocaleString()}</p>
                  <p className="text-sm text-slate-500">{new Date(payment.created_at).toLocaleDateString("en-NG")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "certificates" && (
        <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Certificate approvals</h2>
            <span className="text-sm text-slate-500">{certificates.filter((item: any) => item.status !== "issued").length} pending</span>
          </div>
          <div className="space-y-3">
            {certificates.map((certificate: any) => (
              <div key={certificate.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold">{certificate.certificate_number}</p>
                  <p className="mt-1 text-sm text-slate-500">{certificate.student?.first_name} {certificate.student?.last_name}</p>
                  <p className="text-xs text-slate-400">{certificate.course?.title ?? "Course"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${certificate.status === "issued" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-600"}`}>
                    {certificate.status}
                  </span>
                  {certificate.status !== "issued" && (
                    <button onClick={() => approveCertificate.mutate(certificate.id)} className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs text-brand-700 hover:bg-brand-500/20">
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
