"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function PublicEventsPage() {
  const { data: events = [] } = useQuery({ queryKey: ["public-events"], queryFn: async () => (await api.get("/events")).data });

  return (
    <div className="page-light min-h-screen px-6 py-24 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Upcoming Events</p>
        <h1 className="mt-3 text-4xl font-black">Join our live sessions and workshops</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {events.map((event: any) => (
            <article key={event.id} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">{event.title}</h2>
              <p className="mt-3 text-sm text-slate-600">{event.description ?? "Learn with Terrabyte Academy."}</p>
              <div className="mt-4 text-sm text-brand-500">{new Date(event.start_date).toLocaleString("en-NG")}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
