import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, getAuthSnapshot } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — KimFlights" }] }),
  beforeLoad: () => {
    if (getAuthSnapshot().isAuthenticated) {
      throw redirect({ to: "/admin" });
    }
  },
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(username, pw);
    if (res.ok) {
      navigate({ to: "/admin" });
    } else {
      setError(res.error ?? "Invalid credentials");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={submit} className="animate-fade-up w-full max-w-sm">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Member access
        </p>
        <h1 className="mt-3 text-4xl font-light text-foreground">Sign in.</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Demo credentials — <span className="text-foreground">admin / admin</span>
        </p>
        <div className="mt-12 space-y-6">
          <Field label="Username" type="text" value={username} onChange={setUsername} />
          <Field label="Password" type="password" value={pw} onChange={setPw} />
        </div>
        {error && (
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-destructive">{error}</p>
        )}
        <button
          type="submit"
          className="mt-10 w-full rounded-full bg-foreground py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-background transition hover:opacity-90"
        >
          Continue
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-foreground underline-offset-4 hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-border bg-transparent py-3 text-sm text-foreground outline-none focus:border-foreground"
      />
    </label>
  );
}
