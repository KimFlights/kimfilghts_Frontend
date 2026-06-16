import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MockUser {
  username: string;
  role: "admin" | "user";
}

interface AuthState {
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (username, password) => {
        if (username === "admin" && password === "admin") {
          set({ user: { username: "admin", role: "admin" }, isAuthenticated: true });
          return { ok: true };
        }
        return { ok: false, error: "Invalid credentials" };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "kimflights-auth",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);

// Synchronous snapshot for router beforeLoad guards.
export function getAuthSnapshot() {
  return useAuth.getState();
}
