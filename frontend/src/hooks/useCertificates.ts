import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMyCertificates() {
  return useQuery({
    queryKey: ["my-certificates"],
    queryFn: async () => (await api.get("/certificates/me")).data,
  });
}

export function useVerifyCertificate(certNumber: string) {
  return useQuery({
    queryKey: ["certificate", certNumber],
    queryFn: async () => (await api.get(`/certificates/verify/${certNumber}`)).data,
    enabled: !!certNumber,
  });
}
