import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const { login } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => (await api.post("/auth/login", data)).data,
    onSuccess: (data) => {
      login(data.user, data.access_token, data.refresh_token);
      const redirects: Record<string, string> = { super_admin: "/dashboard/superadmin", admin: "/dashboard/admin", tutor: "/dashboard/tutor", student: "/dashboard/student" };
      router.push(redirects[data.user.role.name] || "/");
      toast.success(`Welcome back, ${data.user.first_name}!`);
    },
    onError: () => toast.error("Invalid email or password"),
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/auth/register", data)).data,
    onSuccess: () => { toast.success("Account created! Please sign in."); router.push("/auth/login"); },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Registration failed"),
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();
  return () => { logout(); router.push("/auth/login"); toast.success("Signed out"); };
}
