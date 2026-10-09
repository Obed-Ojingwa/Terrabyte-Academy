import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMyCertificates() {
  return useQuery({
    queryKey: ["my-certificates"],
    queryFn: async () => (await api.get("/certificates/me")).data,
    refetchInterval: (query) =>
      query.state.data?.some((certificate: { status: string }) => certificate.status === "generating") ? 3000 : false,
  });
}

export function useRequestCertificate() {
  return useMutation({
    mutationFn: async (courseId: string) => (await api.post("/certificates/request", null, { params: { course_id: courseId } })).data,
  });
}

export function useVerifyCertificate(certNumber: string) {
  return useQuery({
    queryKey: ["certificate", certNumber],
    queryFn: async () => (await api.get(`/certificates/verify/${certNumber}`)).data,
    enabled: !!certNumber,
  });
}
