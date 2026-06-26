"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function PublicEventsPage() {
  const { data: events = [] } = useQuery({ queryKey: ["public-events"], queryFn: async () => (await api.get("/events")).data });

  return (
    <div className="min-h-screen bg-[#03091A] px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">Upcoming Events</p>
        <h1 className="mt-3 text-4xl font-black">Join our live sessions and workshops</h1>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {events.map((event: any) => (
            <article key={event.id} className="rounded-3xl border border-white/10 bg-[#071428] p-6">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="mt-3 text-sm text-white/45">{event.description ?? "Learn with Terrabyte Academy."}</p>
              <div className="mt-4 text-sm text-brand-300">{new Date(event.start_date).toLocaleString("en-NG")}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
