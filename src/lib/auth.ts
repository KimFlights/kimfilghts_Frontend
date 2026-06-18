import { create } from "zustand";
import { persist } from "zustand/middleware";

const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8080";

export interface AuthUser {
  username: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  register: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {
            const msg = await res.text().catch(() => "");
            return { ok: false, error: msg || "Invalid credentials" };
          }
          const data = await res.json() as { token: string; username: string; role: string };
          set({
            token: data.token,
            user: { username: data.username, role: data.role },
            isAuthenticated: true,
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Network error — is the backend running?" };
        }
      },

      logout: () => {
        // Fire-and-forget: inform the server (stateless — just for semantic correctness)
        const token = useAuth.getState().token;
        if (token) {
          fetch(`${BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      register: async (username, password) => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/registerUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          if (!res.ok) {
            const msg = await res.text().catch(() => "");
            return { ok: false, error: msg || "Registration failed" };
          }
          return { ok: true };
        } catch {
          return { ok: false, error: "Network error — is the backend running?" };
        }
      },
    }),
    {
      name: "kimflights-auth",
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    },
  ),
);

// Synchronous snapshot for router beforeLoad guards and apiClient.
export function getAuthSnapshot() {
  return useAuth.getState();
}
