"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 1 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: "#071428", color: "#fff", borderRadius: "12px", fontSize: "14px", border: "0.5px solid rgba(55,138,221,0.2)" } }} />
    </QueryClientProvider>
  );
}
