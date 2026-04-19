import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export function useCourses(filters?: Record<string, string>) {
  return useQuery({ queryKey: ["courses", filters], queryFn: async () => (await api.get("/courses", { params: filters })).data });
}

export function useCourse(id: string) {
  return useQuery({ queryKey: ["course", id], queryFn: async () => (await api.get(`/courses/${id}`)).data, enabled: !!id });
}

export function useMyEnrollments() {
  return useQuery({ queryKey: ["my-enrollments"], queryFn: async () => (await api.get("/enrollments/me")).data });
}

export function useEnrollCourse() {
  return useMutation({
    mutationFn: async ({ courseId, mode }: { courseId: string; mode: string }) => (await api.post("/payments/initialize", null, { params: { course_id: courseId, mode } })).data,
    onSuccess: (data) => { window.location.href = data.authorization_url; },
    onError: () => toast.error("Enrollment failed. Please try again."),
  });
}
