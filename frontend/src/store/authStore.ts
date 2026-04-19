import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: { name: "super_admin" | "admin" | "tutor" | "student" };
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, access: string, refresh: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, access, refresh) => {
        Cookies.set("access_token", access, { expires: 1 });
        Cookies.set("refresh_token", refresh, { expires: 7 });
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
    }),
    { name: "terrabyte-auth" }
  )
);
