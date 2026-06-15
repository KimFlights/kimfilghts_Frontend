import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — KimFlights" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={submit} className="animate-fade-up w-full max-w-sm">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Join KimFlights
        </p>
        <h1 className="mt-3 text-4xl font-light text-foreground">Create account.</h1>
        <div className="mt-12 space-y-6">
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={pw} onChange={setPw} />
        </div>
        <button
          type="submit"
          className="mt-10 w-full rounded-full bg-foreground py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-background transition hover:opacity-90"
        >
          Create account
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
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
